---
paths:
  - 'apps/core/src/controllers/**'
  - 'apps/core/src/services/**'
  - 'apps/core/src/repositories/**'
  - 'apps/core/src/mappers/**'
  - 'apps/core/src/schemas/v2/**'
  - 'apps/core/src/errors/**'
  - 'apps/core/src/hooks/**'
---

# Core v2 HTTP layer

- A controller is a `FastifyPluginAsyncZod` using `app.route({ method, url, preHandler, schema, handler })`.
  Register new controllers in `routesV2` in `apps/core/src/app.ts`; `url` is relative, `/v2` is added for you.
- Every route declares `schema.params|querystring|body` and a `response` schema for each status it returns.
  The response schema is the data-exposure boundary: only fields listed there reach the client.
- Auth is explicit per route: `preHandler: [jwtVerifyHook]` (or the admin/session/webhook hooks in `hooks/`).
  A v2 route without a preHandler is public; say so in the PR description.
- Keep handlers thin: validate, call a service, return. Business rules go in a `BaseService` subclass,
  queries in a repository or model statics, shaping in a mapper.
- Errors: throw a `NextError` subclass from `errors/custom-errors.ts` with the next free `NEX####` code,
  an English `description` and a Portuguese `translatedDescription`. Do not use `reply.badRequest` here.
- Read-heavy endpoints cache with `app.cache<T>()` (per-process LRU) or `request.redisService` (shared).
  Invalidate or bound the TTL; stale data is a bug report from students.
- Every new route gets an integration test in `apps/core/tests/integration/` (see `test-writer` agent).
