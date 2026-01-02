# UFABC Next Backend - AI Agent Instructions

## Architecture Overview

**Monorepo** using Turborepo + pnpm workspaces:
- `apps/core` — Fastify API (main application)
- `packages/common` — Shared utilities (`currentQuad`, `calculateCoefficients`, `generateIdentifier`)
- `packages/db` — Mongoose models and database client as a Fastify plugin
- `packages/queues` — BullMQ job system with type-safe `JobBuilder` pattern
- `packages/testing` — Testcontainers setup for integration tests

## Key Patterns

### Route Registration
Routes use `@fastify/autoload` with file-based routing in `apps/core/src/routes/`. Authentication is controlled in `autohooks.ts`:
- `PUBLIC_ROUTES` — No authentication
- `EXTENSION_ROUTES` — Session-based auth via `request.isStudent()`
- All other routes — JWT via `request.jwtVerify()`

### V2 Controllers
New controllers use `fastify-type-provider-zod` under `/v2` prefix. Add to `routesV2` array in `apps/core/src/app.ts`:
```typescript
const controller: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/endpoint',
    schema: { body: z.object({...}), response: { 200: z.object({...}) } },
    handler: async (request, reply) => { /* ... */ }
  });
};
```

### Hooks Pattern
Hooks in `apps/core/src/hooks/` validate external sessions and cache results. Pattern:
1. Extend `FastifyRequest` or `@fastify/request-context` with session type
2. Extract credentials from headers
3. Check cache (LRU or Redis), return early if valid
4. Validate against external service
5. Cache valid session, attach to request context

See `moodle-session.ts` (uses LRU cache) and `sigaa-session.ts` (uses Redis) for examples.

### Job System (Two Systems Coexist)
**Legacy jobs** in `apps/core/src/queue/` — Use `JOBS` and `QUEUE_JOBS` in `definitions.ts`

**New jobs** in `apps/core/src/jobs/` — Use `defineJob()` builder:
```typescript
export const myJob = defineJob('JOB_NAME')
  .input(z.object({ data: z.string() }))
  .handler(async ({ job, app, manager }) => { /* ... */ });
```
Register in `apps/core/src/jobs/registry.ts`.

### Database Access
Models accessed via `app.db` (decorated by `@next/db`). Schemas in `apps/core/src/models/`.

### External Connectors
Connectors in `apps/core/src/connectors/` wrap external APIs:
- `MoodleConnector` — UFABC Moodle
- `SigaaConnector` — Academic system
- `S3Connector` — AWS S3 (LocalStack in dev)

## Development Commands

```bash
pnpm i                    # Install dependencies
pnpm build                # Build all packages (required before first run)
pnpm services:up          # Start MongoDB, Redis, LocalStack via Docker
pnpm dev                  # Development server with hot reload
pnpm test                 # Run tests with Vitest
pnpm lint                 # Lint (oxlint) + format (oxfmt)
```

### Environment Setup
```bash
cp apps/core/.env.example apps/core/.env.dev
```

## Testing

- **Vitest** with **Testcontainers** (MongoDB, Redis, LocalStack)
- Enable container reuse: `testcontainers.reuse.enabled=true` in `.testcontainer.properties`
- Use `startTestStack()` from `@next/testing` for isolated infrastructure
- Queue workers skip automatically when `NODE_ENV=test`

## Deployment

Docker multi-stage build with git-secret for encrypted env vars:
```bash
docker build --secret id=env,src=.env -f ./Dockerfile . -t ufabc-next:latest
```
Production runs on port 5000 with `pnpm run start`.

## Configuration

Env vars validated via Zod in `apps/core/src/plugins/external/config.ts`. Access via `app.config.VAR_NAME`.

## Workspace Imports

- `@next/common` — Shared utilities
- `@next/db/client` — Database plugin
- `@next/db/models` — Model types
- `@next/queues/manager` — JobManager
- `@next/queues/client` — `defineJob()`
- `@next/testing` — Test helpers
- `@/` — Path alias within `apps/core` (e.g., `@/connectors/moodle.js`)

## Change Impact Categories (Blast Radius)

### Small Bomb
- **Scope**: Single route, model, utility, or schema
- **Action**: Atomic commit with focused description
- **Testing**: Run specific test file only
- **Examples**: Adding a new endpoint, fixing a bug in one model

### Medium Bomb  
- **Scope**: Controller + related schemas, service + models
- **Action**: Single commit but verify integration
- **Testing**: Run related test suite + integration tests
- **Examples**: Adding V2 controller with multiple endpoints, refactoring service layer

### Large Bomb
- **Scope**: Core infrastructure (plugins, jobs, auth), database schema changes
- **Action**: Multiple commits, each with clear scope
- **Testing**: Full test suite + manual verification
- **Examples**: Migrating from legacy to new job system, changing auth patterns

## Strict Prohibitions

### NEVER Use These Patterns
- **`any` type** - Use `unknown` with type guards or proper interfaces
- **Legacy queue system** - Always prefer `defineJob()` in `/jobs/` over `/queue/`
- **Direct request object mutation** - Create copies: `const data = { ...request.body }`
- **Bypassing Zod validation** - All V2 routes MUST use `fastify-type-provider-zod`
- **Cross-package import pollution** - Respect workspace boundaries, use proper exports

### ALWAYS Follow These Patterns
- **Type-first development** - Define interfaces/Zod schemas before implementation
- **Atomic commits** - One logical change per commit
- **Test before finish** - Run relevant tests before marking task complete
- **Prefer V2 patterns** - Use new controller pattern over legacy file-based routes

## Debugging Protocol

### When Tests Fail
1. **Check Infrastructure**: `pnpm services:up` (MongoDB, Redis, LocalStack)
2. **Verify Environment**: Ensure `apps/core/.env.dev` exists and is valid
3. **Run Single Test**: `pnpm test path/to/failing.test.spec.ts`
4. **Check Container Reuse**: Verify `testcontainers.reuse.enabled=true` in `.testcontainer.properties`
5. **Clean State**: `docker compose down -v && pnpm services:up` if containers are corrupted

### When Build Fails
1. **Check Dependencies**: `pnpm i` to ensure workspace links are correct
2. **Type Errors**: Run `pnpm tsc` for detailed TypeScript diagnostics
3. **Clean Build**: `rm -rf apps/core/dist && pnpm build`

### When Runtime Fails
1. **Check Port Conflicts**: Ensure ports 5000, 27017, 6379 are available
2. **Verify Services**: `docker ps` to confirm all containers are running
3. **Check Logs**: `docker compose logs [service-name]` for detailed errors

## Decision Trees

### Route Implementation Choices
```
Need new endpoint?
├─ Need strict typing + OpenAPI? → V2 controller in /controllers/
├─ Simple public endpoint? → File-based route in /routes/public/
├─ Extension route (student auth)? → File-based route in /routes/entities/
└─ Admin/internal route? → File-based route with JWT auth
```

### Background Processing Choices
```
Need background work?
├─ New feature? → defineJob() in /jobs/ (register in registry.ts)
├─ Maintaining existing? → Use existing job system location
└─ Simple one-off? → Consider if endpoint sync is sufficient
```

### Database Access Patterns
```
Need data operations?
├─ New entity? → Model in /models/ + schema in /schemas/entities/
├─ Complex query? → Service in /services/ or /routes/*/service.ts
├─ Simple CRUD? → Direct in route controller
└─ Cross-entity logic? → Service layer with transaction support
```

### Authentication Strategy
```
Protecting endpoint?
├─ Public data? → Add to PUBLIC_ROUTES in autohooks.ts
├─ Student session required? → Add to EXTENSION_ROUTES in autohooks.ts
├─ JWT token required? → Default (no list addition needed)
└─ Admin/board access? → Use authenticateBoard hook
```
