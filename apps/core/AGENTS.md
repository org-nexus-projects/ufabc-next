# `@next/core` — Backend API

Fastify 5 API with Mongoose (MongoDB), BullMQ (Redis), and AWS (S3, SES,
LocalStack in development). It serves the web app, the extension, and receives
webhooks from `ufabc-parser`. Read the root [`AGENTS.md`](../../AGENTS.md) first.

## Commands

```bash
pnpm --filter @next/docker-infra up        # MongoDB, Redis, LocalStack (docker-compose.yml)
pnpm --filter @next/core dev:local         # tsx watch, reads apps/core/.env (copy from .env.example)
pnpm --filter @next/core tsc               # type check (tsgo)
pnpm exec oxlint apps/core/src             # lint; core has no lint script of its own
pnpm --filter @next/core exec vitest run   # all tests, needs Docker running
pnpm --filter @next/core exec vitest run tests/integration/components/list.spec.ts
```

`@next/logger` exports from `dist/`. If `tsc` or `oxlint` report
`Cannot find module '@next/logger/...'`, run `pnpm turbo run build --filter=@next/logger` first.

## Layout

```text
src/
  app.ts               buildApp(): plugins, v2 controllers, legacy autoload routes, queues
  server.ts            process entry point
  constants.ts         shared constants, JOB_NAMES, cache sizes, regexes
  controllers/         v2 HTTP endpoints (Zod), registered in app.ts `routesV2`, prefixed /v2
  routes/              legacy endpoints loaded by @fastify/autoload (index.ts + service.ts per folder)
  services/            business logic; new services extend BaseService
  repositories/        data access; new repositories extend BaseRepository
  mappers/             document -> response shape (e.g. TeacherSummaryMapper.toResponse)
  models/              Mongoose schemas and models (see the `data-model` skill)
  schemas/             legacy OpenAPI/Zod route schemas; schemas/v2 holds v2 Zod schemas
  errors/              NextError and custom errors with NEX#### codes
  hooks/               preHandler hooks: jwtVerifyHook, admin, sessions, webhook auth
  jobs/                v2 BullMQ jobs (defineJob) + registry.ts
  queue/               legacy queue system (app.job / app.worker); do not add jobs here
  connectors/          HTTP/AWS clients for SIGAA, Matrícula, Moodle, ufabc-parser, AI proxy
  plugins/             external (config, jwt, cors, ...), custom (cache, tracing, ...), v2 (setup, error handler, queue, redis, aws)
  lib/                 AWS and Notion helpers
  utils/               logger (getClassLogger, getGlobalTraceId) and small helpers
tests/
  integration/         full app against Testcontainers (MongoDB, Redis, LocalStack)
  unit/                pure functions
```

## Two generations of code

New work goes into the **v2** style. Only touch legacy code to fix it or migrate it.

| Concern    | v2 (use this)                                                        | Legacy (maintain only)                                 |
| ---------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| HTTP       | `controllers/*-controller.ts`, `FastifyPluginAsyncZod`, `app.route({...})` | `routes/**/index.ts`, `FastifyPluginAsyncZodOpenApi` |
| Schemas    | `schemas/v2/*.ts` (Zod)                                              | `schemas/*.ts`                                         |
| Logic      | `services/*-service.ts` class extending `BaseService`               | `routes/**/service.ts` free functions                  |
| Errors     | throw a `NextError` subclass from `errors/custom-errors.ts`          | `reply.badRequest(...)` / `reply.notFound(...)`        |
| Jobs       | `jobs/*.ts` with `defineJob` from `@next/queues/client`, `app.manager.dispatch` | `queue/jobs/*.job.ts`, `app.job`            |
| Auth       | explicit `preHandler: [jwtVerifyHook]` (or a session hook) per route | `routes/autohooks.ts` with `PUBLIC_ROUTES` allowlist   |

## Conventions

- **Controllers** are thin: parse input (schema), call a service, map/return, throw `NextError`. Declare
  `schema.params|querystring|body` and every `response` status with Zod; the response schema strips extra
  fields, so it is also the data-exposure boundary.
- **Services** extend `BaseService` (`services/base-service.ts`). Use `this.logger` (a class logger with
  `component` and `globalTraceId`) and pass `{ globalTraceId: this.globalTraceId }` to repositories and connectors.
- **Errors**: add a class to `errors/custom-errors.ts` with the next free `NEX####` code, an HTTP status, an
  English `description` and a Portuguese `translatedDescription` (shown to users). The global handler in
  `plugins/v2/error-handler.ts` serializes it.
- **Logging**: Pino. Log objects first, message second: `this.logger.warn({ teacherId }, 'Teacher not found')`.
  Never log RA, email, tokens, cookies, or full payloads at `info` or above.
- **Caching**: in-process LRU cache via `app.cache<T>()` (per instance, lost on deploy); shared cache via
  `request.redisService` / `app.redis`, and distributed locks via `request.acquireLock` / `request.releaseLock`.
  Bound every in-memory map (see `TEACHER_CACHE_MAX_SIZE` in `constants.ts`).
- **Config**: env vars are validated in `plugins/external/config.ts` and read from `app.config`. When you add one,
  update `.env.example` and the `env` block in `.github/workflows/ci.yml` (ask first).
- **Imports**: `@/` alias for `src/`, always with the `.js` extension: `import { X } from '@/services/x-service.js'`.
- **Module augmentation** (`declare module 'fastify' { interface FastifyInstance ... }`) must stay an `interface`;
  that `consistent-type-definitions` finding is a known false positive.

## Tests

- Tests need Docker and an `apps/core/.env`: the config plugin validates every variable before the test stack
  overrides MongoDB/Redis/AWS. In a fresh checkout `cp apps/core/.env.example apps/core/.env` is enough.
  An `env must have required property ...` error means `.env.example` is missing a variable added to `plugins/external/config.ts`.
- Integration tests boot the real app with `startTestStack()` from `@next/testing/containers` and
  `app.register(fp(buildApp), { config: { ...stack.config, NODE_ENV: 'test' } })`, then use `app.inject`.
  Copy the setup from `tests/integration/components/list.spec.ts`.
- Seed data with the Mongoose models directly; clean up what you create in `afterAll`.
- External HTTP is mocked with `nock`; Moodle fixtures are in `@next/testing/mocks`.
- Pure logic (mappers, helpers, model utilities) gets a unit test in `tests/unit/` with no containers.
- Testcontainers reuse is on (`.testcontainer.properties`), so the first run is slow and later runs are fast.

## Gotchas

- Route `url`s in v2 controllers are relative; the `/v2` prefix is added by `setupV2Routes` in `plugins/v2/setup.ts`.
  Validation/serialization is picked per route: Zod for `/v2`, OpenAPI for legacy.
- `apps/core/src/connectors` and `packages/connectors` contain similar code. Core imports its own copies
  (`@/connectors/...`); the extension uses `@next/connectors`. Fix bugs in both when they apply to both.
- Mongoose hooks carry business logic (enrollment -> groups, reaction counts, comment uniqueness). Check the
  model before writing to a collection directly with `updateMany`/`bulkWrite`, which skip document hooks.
- Deploys run on every push to `main` touching `apps/core`, `packages/db`, `packages/queues`, `packages/utils`,
  `Dockerfile`, or the lockfile.
