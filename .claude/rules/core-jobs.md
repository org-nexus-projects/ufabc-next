---
paths:
  - 'apps/core/src/jobs/**'
  - 'packages/queues/**'
---

# Background jobs (BullMQ)

- Define jobs with `defineJob(JOB_NAMES.X)` from `@next/queues/client`, add the name to `JOB_NAMES` in
  `apps/core/src/constants.ts`, and register the job in `apps/core/src/jobs/registry.ts`.
- Validate input with `.input(z.object(...))`. Job data is persisted in Redis: keep it small (ids, not documents)
  and free of tokens or passwords.
- Handlers must be idempotent: BullMQ retries on failure and webhooks can be delivered twice.
  Use upserts, `$addToSet`, or a `deliveryId` check instead of blind inserts.
- Dispatch with `app.manager.dispatch(JOB_NAMES.X, data)`; use `dispatchFlow` for parent/child pipelines.
- Log with the job's `globalTraceId` so a webhook, its job, and its children share one trace.
- Throw on unrecoverable input (it goes to the failed set); return early on "nothing to do".
- `.every(pattern)` takes an `ms` interval (`'45 minutes'`), not a cron expression, despite the example in
  `packages/queues/README.md`.
