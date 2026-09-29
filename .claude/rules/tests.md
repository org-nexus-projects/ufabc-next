---
paths:
  - '**/*.spec.ts'
  - '**/*.test.ts'
  - 'apps/core/tests/**'
  - 'packages/testing/**'
---

# Tests

- Core integration tests start the real app against Testcontainers (`startTestStack()` from
  `@next/testing/containers`) and call it with `app.inject`. Docker must be running.
- Run one file while iterating: `pnpm --filter @next/core exec vitest run <path>`; never leave Vitest in watch mode.
- Assert behavior a user would notice: status codes, response bodies, stored documents, dispatched jobs.
  Cover the unauthenticated case for every protected route.
- Seed through Mongoose models and delete what you created in `afterAll`; tests share one database per run.
- Mock external HTTP with `nock` (core) or MSW (container). Tests must not reach UFABC systems or AWS.
- A failing test is information. Fix the code or ask; do not weaken assertions, add `.skip`, or delete the test.
