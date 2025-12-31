# AGENTS.md - V2 Architecture Guide

## Development Commands

### Build & Test

- `pnpm build` - Build entire monorepo (required before running tests)
- `pnpm tsc` - Type check all packages in parallel
- `pnpm test` - Run all tests across monorepo
- `pnpm --filter @next/core test` - Run core app tests only
- `pnpm --filter @next/core test path/to/test.spec.ts` - Run single test file
- `pnpm --filter @next/core test --watch` - Watch mode for core tests

### Lint & Format

- `pnpm lint` - Run oxlint + oxfmt with auto-fix
- `pnpm lint:ci` - Run linting in CI mode (quiet, no auto-fix)
- `oxlint --type-aware --fix` - Direct oxlint with type awareness
- `oxfmt` - Direct formatting

### Development

- `pnpm dev` - Start all services and apps in parallel
- `pnpm --filter @next/core dev` - Start core app only
- `pnpm services:up` - Start Docker services (MongoDB, Redis, LocalStack)

## V2 Architecture Overview

The V2 architecture introduces a **plugin-based system** with enhanced type safety, job builder patterns, and improved connector abstractions while maintaining backward compatibility with V1 routes through a hybrid compiler.

### Core V2 Components

#### 1. V2 Plugin System (`apps/core/src/plugins/v2/`)

**Hybrid Compiler Setup** (`setup.ts`):

- Enables coexistence of V1 and V2 routes
- V2 routes (`/v2/*`) use `fastify-type-provider-zod`
- V1 routes continue using `fastify-zod-openapi`

```typescript
// Route registration pattern
const routesV2 = [componentsController, backofficeController];
await setupV2Routes(app, routesV2);
```

**Essential V2 Plugins**:

- `queue.ts`: JobManager with BullMQ integration
- `aws.ts`: S3Connector and AWS service management
- `redis.ts`: Redis service with distributed locking
- `test-utils.ts`: Token generation and test utilities

#### 2. V2 Connectors (`apps/core/src/connectors/`)

**Base Requester Pattern** (`base-requester.ts`):

- Centralized HTTP client with tracing
- Automatic trace ID propagation
- Structured request/response logging
- Error handling with status code awareness

```typescript
export class BaseRequester {
  constructor(
    private readonly baseURL: string,
    private readonly logger: FastifyBaseLogger,
    tracer: Tracer
  ) {}
  // Automatic trace ID injection and logging
}
```

**AWS Connector Base** (`base-aws-connector.ts`):

- Abstract base class for AWS services
- Middleware stack for logging/tracing
- Consistent error handling patterns
- Type-safe client management

```typescript
export class S3Connector extends BaseAWSConnector<S3Client> {
  async upload(bucket: string, key: string, body: Buffer | Uint8Array) {
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, Body: body });
    return this.client.send(command);
  }
}
```

#### 3. V2 Route Patterns (`apps/core/src/routes/`)

**Controller-Based Architecture**:

- Uses `FastifyPluginAsyncZod` from `fastify-type-provider-zod`
- Pure Zod schema validation (no OpenAPI decorators)
- Type-safe request/response handling
- Dependency injection via Fastify decorators

```typescript
const componentsController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/components/archives',
    preHandler: [moodleSession],
    schema: {
      response: { 202: z.object({ status: z.string() }) },
      headers: z.object({
        'session-id': z.string(),
        'sess-key': z.string(),
      }),
    },
    handler: async (request, reply) => {
      // Access to app.manager, app.aws.s3, app.redis via decorators
      await app.manager.addJob(componentsCreate, { data: request.body });
      return reply.status(202).send({ status: 'processing' });
    },
  });
};
```

**V1 to V2 Bridge Pattern**:

```typescript
// Legacy routes proxy to V2 implementations
app.post('/', async (request, reply) => {
  return app
    .inject({
      method: request.method,
      url: '/v2/components/archives',
      body: request.body,
      headers: request.headers,
    })
    .then((res) => {
      reply.status(res.statusCode);
      reply.headers(res.headers);
      reply.send(res.body);
    });
});
```

#### 4. V2 Schema Patterns (`apps/core/src/schemas/v2/`)

**Pure Zod Schemas**:

- No OpenAPI decorators
- Focus on data validation only
- Reusable across controllers and services

```typescript
export const componentArchiveSchema = z
  .object({
    viewurl: z.string().url(),
    fullname: z.string(),
    id: z.number(),
  })
  .array();

// Service integration with error handling
export async function getComponentArchives(components: MoodleComponent | undefined) {
  const componentArchives = componentArchiveSchema.safeParse(components?.data.courses);
  if (!componentArchives.success) {
    return { error: componentArchives.error.message, data: null };
  }
  return { error: null, data: componentArchives.data };
}
```

#### 5. V2 Job Builder Pattern (`apps/core/src/queue/jobs/` + `packages/queues/`)

**JobBuilder Class** (`packages/queues/src/builder.ts`):

- Fluent API for job configuration
- Type-safe input/output validation with Zod
- Iterator pattern for array processing
- Built-in retry, rate limiting, and scheduling

```typescript
export const myJob = defineJob('MyJob')
  .input(z.object({ items: z.array(z.string()) }))
  .output(z.object({ processed: z.number() }))
  .iterator('items') // Split array into individual jobs
  .retry(3, 1000, { type: 'exponential' })
  .concurrency(5)
  .every('1 hour')
  .handler(async ({ job, app, manager }) => {
    // Process single item from the array
    return { processed: job.data.items.length };
  });
```

**JobManager Integration**:

- Automatic queue and worker management
- Flow producer for job dependencies
- Bull Board integration for monitoring
- Centralized error handling

```typescript
// In controllers
await app.manager.addJob(componentsCreate, { data: request.body });

// Job definition example
export const componentsCreate = defineJob('componentsCreate')
  .input(z.object({ /* validation */ }))
  .handler(async ({ job, app }) => {
    const { archive } = await app.aws.s3.download(job.data.bucket, job.data.key);
    // Processing logic
  });
```

## Monorepo Package Structure

### Core V2 Packages

#### `@next/queues` (`packages/queues/`)

- **JobBuilder**: Fluent API for job definition
- **Manager**: Queue and worker lifecycle management
- **Builder Pattern**: Type-safe job configuration with Zod

```typescript
// Job definition with builder
export const enrolledStudents = defineJob('enrolledStudents')
  .input(z.object({ /* input schema */ }))
  .output(z.object({ /* output schema */ }))
  .every('10 minutes')
  .handler(async ({ job, app, manager }) => {
    // Implementation
  });
```

#### `@next/db` (`packages/db/`)

- **MongoDB Integration**: Mongoose ODM with TypeScript
- **Connection Management**: Centralized connection handling
- **Query Builders**: Type-safe database operations

```typescript
// Model usage in V2
export class StudentModel {
  static async findByRa(ra: string) {
    return Student.findOne({ ra }).lean();
  }
}
```

#### `@next/common` (`packages/common/`)

- **Shared Utilities**: Common functions and types
- **Calculation Functions**: Coefficient calculations, quad finding
- **Identifier Logic**: Student and entity identification

```typescript
// Reusable utility
import { calculateCoefficients } from '@next/common';
const result = calculateCoefficients(studentData);
```

#### `@next/testing` (`packages/testing/`)

- **Testcontainers**: Real service integration testing
- **Mock Factories**: Test data generation
- **Test Utilities**: Common testing patterns

```typescript
// Integration testing pattern
const stack = await startTestStack();
const app = fastify({ logger: true });
await app.register(fp(buildApp), { config: { ...stack.config, NODE_ENV: 'test' } });
```

## V2 Development Patterns

### Creating New V2 Routes

1. **Define Schema** (`apps/core/src/schemas/v2/`):

```typescript
export const myRequestSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});
```

2. **Create Controller** (`apps/core/src/controllers/`):

```typescript
const myController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/v2/my-endpoint',
    schema: {
      body: myRequestSchema,
      response: { 201: z.object({ id: z.string() }) },
    },
    handler: async (request, reply) => {
      // Use app.manager, app.aws, app.redis
      const result = await app.manager.addJob(myJob, { data: request.body });
      return reply.status(201).send({ id: result.id });
    },
  });
};
```

3. **Register Route** (`apps/core/src/app.ts`):

```typescript
const routesV2 = [componentsController, backofficeController, myController];
await setupV2Routes(app, routesV2);
```

### Creating V2 Jobs

1. **Define Job with Builder**:

```typescript
export const myJob = defineJob('myJob')
  .input(z.object({ /* input validation */ }))
  .output(z.object({ /* output validation */ }))
  .retry(3, 1000)
  .handler(async ({ job, app, manager }) => {
    // Job implementation
    // Access to app.config, app.aws, app.redis, app.manager
  });
```

2. **Register Job** (`apps/core/src/queue/jobs/registry.ts`):

```typescript
import { myJob } from './my-job';
export const jobs = [componentsCreate, enrolledStudents, myJob];
```

### Creating V2 Connectors

1. **Extend Base Connector**:

```typescript
export class MyServiceConnector extends BaseAWSConnector<MyServiceClient> {
  constructor(logger: FastifyBaseLogger, tracer: Tracer) {
    super(new MyServiceClient({}), logger, tracer);
  }

  async processData(data: unknown) {
    const command = new ProcessCommand({ data });
    return this.client.send(command);
  }
}
```

2. **Register in Plugin** (`apps/core/src/plugins/v2/aws.ts`):

```typescript
export default fp(async function awsV2Plugin(app) {
  app.aws = {
    s3: new S3Connector(app.log, app.tracer),
    myService: new MyServiceConnector(app.log, app.tracer),
  };
});
```

## Configuration

### V2 Plugin Setup (`apps/core/src/app.ts`)

```typescript
// Core V2 plugins registration
await app.register(redisV2Plugin, {
  redisURL: new URL(app.config.REDIS_CONNECTION_URL)
});
await app.register(queueV2Plugin);
await app.register(awsV2Plugin);
await app.register(fp(setupV2Routes), { routes: routesV2 });
```

### Environment Variables

- `REDIS_CONNECTION_URL`: Redis for queues and caching
- `MONGODB_CONNECTION_URL`: MongoDB connection
- `USE_LOCALSTACK`: Use LocalStack for AWS services
- `NODE_ENV`: Environment (development/test/production)

## Testing V2 Components

### Integration Testing with Testcontainers

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestStack } from '@next/testing';
import fastify from 'fastify';

describe('V2 Components Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const stack = await startTestStack();
    app = fastify({ logger: true });
    await app.register(fp(buildApp), {
      config: { ...stack.config, NODE_ENV: 'test' }
    });
  });

  it('should process V2 route', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v2/components/archives',
      headers: { 'session-id': 'test', 'sess-key': 'test' },
      body: { /* test data */ },
    });
    expect(res.statusCode).toBe(202);
  });
});
```

### Job Testing

```typescript
it('should process job correctly', async () => {
  const result = await myJob.handler({
    job: { data: { /* test input */ } },
    app,
    manager: app.manager,
  });
  expect(result).toEqual({ /* expected output */ });
});
```

## Migration Strategy

### V1 to V2 Migration Path

1. **Identify V1 Route**: Find routes that need V2 features
2. **Create V2 Schema**: Move validation to pure Zod schemas
3. **Implement V2 Controller**: Use V2 patterns and plugins
4. **Update Route Registration**: Add to V2 routes array
5. **Add Bridge Pattern**: Keep V1 route proxying to V2
6. **Gradual Removal**: Once V2 is stable, remove V1 bridge

### Compatibility Layer

The hybrid compiler ensures seamless operation:

- V1 routes continue working unchanged
- V2 routes get enhanced type safety
- Shared infrastructure works with both
- Gradual migration without downtime

## Best Practices

### Code Organization

- **Controllers**: Route handlers and HTTP logic
- **Services**: Business logic and external integrations
- **Connectors**: External API and service clients
- **Schemas**: Data validation and type definitions
- **Jobs**: Background processing and workflows

### Error Handling

- Use Zod's `safeParse` for data validation
- Implement structured error responses
- Log errors with `app.log.error()`
- Return appropriate HTTP status codes

### Performance

- Leverage JobBuilder iterator for large arrays
- Use Redis for caching and distributed locking
- Implement proper connection pooling
- Monitor queue performance with Bull Board

### Security

- Validate all inputs with Zod schemas
- Use environment variables for configuration
- Implement proper authentication in controllers
- Never commit secrets or API keys

## Common V2 Patterns

### Service Integration

```typescript
export class MyService {
  constructor(private readonly app: FastifyInstance) {}

  async processData(data: unknown) {
    // Use app.aws.s3, app.redis, app.manager
    const result = await this.app.manager.addJob(myJob, { data });
    return result;
  }
}
```

### Plugin Development

```typescript
import { fastifyPlugin as fp } from 'fastify-plugin';

export default fp(async function myV2Plugin(app) {
  app.decorate('myService', new MyService(app));
});
```

### Controller Dependencies

```typescript
const controller: FastifyPluginAsyncZod = async (app) => {
  // Access to:
  // - app.config: Configuration
  // - app.manager: Job management
  // - app.aws.s3: S3 operations
  // - app.redis: Redis operations
  // - app.log: Structured logging
};
```

## Code Style Guidelines

### TypeScript & Imports

- Use ES modules (`import`/`export`) exclusively
- Prefer named exports over default exports
- Use `import.meta.dirname` for path operations
- Import order: external libs → internal packages → local modules

### Formatting

- Single quotes for strings
- LF line endings
- No trailing whitespace
- 2-space indentation (enforced by oxfmt)
- Use Biome/Oxlint for linting rules

### Naming Conventions

- Files: kebab-case (`my-service.ts`, `user-controller.ts`)
- Classes/PascalCase: `UserService`, `StudentModel`
- Functions/variables: camelCase (`getUserById`, `studentData`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- Interfaces: PascalCase with `I` prefix only for external types

## What to Avoid

- Don't modify global tooling (Turbo, pnpm, Biome) without repo-wide consensus
- Don't hardcode environment values - always use `app.config`
- Don't use default exports - prefer named exports
- Don't ignore type errors - fix them before committing
- Don't add unnecessary dependencies - check existing packages first
- Don't commit secrets or sensitive configuration
- Don't bypass validation - always use Zod schemas for API inputs

This V2 architecture provides enhanced type safety, improved developer experience, and better maintainability while maintaining backward compatibility through the hybrid compiler system.
