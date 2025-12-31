# AGENTS.md

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

### Error Handling
- Use Fastify's centralized error handler in `app.ts`
- Return structured errors with appropriate HTTP status codes
- 422 for validation errors, 500 for internal/serialization errors
- Use Zod for input validation and error reporting
- Log errors with `app.log.error()` using structured logging

### Types & Validation
- Use Zod schemas for all API input/output validation
- Leverage `fastify-type-provider-zod` for type-safe routes
- Use `zod-openapi` for OpenAPI documentation
- Prefer explicit types over `any` - use `unknown` when necessary
- Use `@total-typescript/ts-reset` for better type safety

### Architecture Patterns

#### Fastify Plugins
- External plugins: `apps/core/src/plugins/external/` (third-party wrappers)
- Custom plugins: `apps/core/src/plugins/custom/` (app-specific logic)
- Export Fastify plugins using `fastifyPlugin` helper
- Use `app.decorate()` to add app-level utilities

#### Routes V2
- Manually created using MVC patterns `apps/core/src/{controller, service}`
- Use Zod schemas for request/response validation
- Follow RESTful conventions where appropriate
- Use `fastify-zod-openapi` for OpenAPI docs
- Avoid filenames matching `test|spec|service` patterns

#### Jobs & Queue
- Jobs in `apps/core/src/queue/jobs/`
- Use BullMQ with Redis backend
- Schedule using every function from the builder queues package
- Implement proper error handling and retry logic

#### Database
- MongoDB with Mongoose ODM
- Models in `apps/core/src/models/`
- Connection string via `MONGODB_CONNECTION_URL` config
- Use TypeScript interfaces for model typing

### Configuration
- Environment variables defined in `apps/core/src/plugins/external/config.ts`
- Use Zod schema for config validation
- Access config via `app.config.VARIABLE_NAME`
- Update `.env.example` when adding new variables
- Respect defaults and local development values

### Testing
- Use Vitest for unit/integration tests
- Test files: `*.spec.ts` or `*.test.ts`
- Use Testcontainers for integration tests with real services
- Mock external dependencies (AWS, Notion, etc.)
- Follow AAA pattern (Arrange, Act, Assert)

### Security
- Never commit secrets or API keys
- Use environment variables for sensitive data
- Implement proper authentication/authorization in custom plugins
- Validate all user inputs with Zod schemas
- Use HTTPS in production

### Performance
- Use connection pooling for database/Redis
- Implement proper caching strategies
- Use `lru-weak-cache` for in-memory caching
- Optimize database queries with proper indexes
- Use streaming for large file operations

## Integration Points

### AWS Services
- S3 for file storage (configurable via LocalStack)
- SES for email sending
- Use `USE_LOCALSTACK` flag for local development
- AWS clients configured in `apps/core/src/connectors/{aws-service}`

### External APIs
- Notion integration via `@notionhq/client`
- OAuth2 for third-party authentication
- Webhook support for external system integration

### Development Services
- MongoDB: `mongodb://127.0.0.1:27017/ufabc-matricula`
- Redis: Queue backend and caching
- LocalStack: AWS service emulation

## Common Patterns

### Service Creation
```ts
// apps/core/src/services/my-service.ts
export class MyService {
  constructor(private readonly app: FastifyInstance) {}

  async doSomething(data: unknown): Promise<Result> {
    // Implementation
  }
}
```

### Plugin Registration
```ts
// apps/core/src/plugins/custom/my-plugin.ts
import { fastifyPlugin as fp } from 'fastify-plugin';

export default fp(async function (app) {
  app.decorate('myService', new MyService(app));
});
```

### Route Definition
```ts
// apps/core/src/routes/my-route.ts
import { z } from 'zod';

const schema = {
  body: z.object({ /* validation */ }),
  response: { 200: z.object({ /* response */ }) }
};

export async function myRoute(app: FastifyInstance) {
  app.post('/endpoint', { schema }, async (request, reply) => {
    // Handler logic
  });
}
```

## What to Avoid

- Don't modify global tooling (Turbo, pnpm, Biome) without repo-wide consensus
- Don't hardcode environment values - always use `app.config`
- Don't use default exports - prefer named exports
- Don't ignore type errors - fix them before committing
- Don't add unnecessary dependencies - check existing packages first
- Don't commit secrets or sensitive configuration
- Don't bypass validation - always use Zod schemas for API inputs
