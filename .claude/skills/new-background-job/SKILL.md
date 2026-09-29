---
name: new-background-job
description: Workflow to add or change a BullMQ background job in apps/core with defineJob, JOB_NAMES, the job registry, idempotency, and tests. Use when work must run asynchronously, on a schedule, after a webhook, or in a multi-step flow.
---

# New background job in `@next/core`

Read `packages/queues/README.md` (builder API) and one existing job close to your case:

| Case | Example |
| --- | --- |
| Webhook-triggered, idempotent upsert | `apps/core/src/jobs/teacher-created.ts` |
| Parent/child flow | `apps/core/src/jobs/components-archive-processing-flow.ts` (`manager.dispatchFlow`) |
| Job dispatching another job | `apps/core/src/jobs/student-sync-processing.ts` (`app.manager.dispatch`) |

## Steps

1. **Name**: add `MY_JOB: 'my_job'` to `JOB_NAMES` in `apps/core/src/constants.ts` (snake_case value).
2. **Define** in `apps/core/src/jobs/<name>.ts`:
   ```ts
   export const myJob = defineJob(JOB_NAMES.MY_JOB)
     .input(z.object({ componentId: z.string() }))
     .retry(3, 1000, { type: 'exponential', delay: 1000 })   // only if the default does not fit
     .handler(async ({ job, app }) => {
       // idempotent work here
     });
   ```
   Repeating jobs use `.every('45 minutes')` (see `enrolled-students.ts`). The pattern is parsed with `ms`, so it is
   an interval, not a cron expression: `packages/queues/README.md` shows `'0 2 * * *'`, which does not work.
3. **Register** it in `jobRegistry` in `apps/core/src/jobs/registry.ts`. An unregistered job is dispatched and never processed.
4. **Dispatch** from a service or controller with `app.manager.dispatch(JOB_NAMES.MY_JOB, data)`
   (or `request.server.manager`). Pass ids, not documents; job data lives in Redis and in Bull Board.
5. **Idempotency**: assume the job runs twice. Upsert by a natural key, use `$addToSet`, or record the
   `deliveryId`/`idempotencyKey` (see `history_processing_jobs` in the `data-model` skill).
6. **Failure**: throw for errors that should retry or land in the failed set; return early for "nothing to do".
   Never swallow an error without logging it with the job id.
7. **Legacy**: do not add jobs to `apps/core/src/queue/`. If you replace one there, remove its registration in the same PR
   only after the v2 job is dispatched everywhere.

## Test

- Extract the pure logic (matching, parsing, calculations) into functions and unit test them in `apps/core/tests/unit/`.
- For the handler, an integration test can build the app with `startTestStack()`, call the handler with a fake
  `job` object and `app`, and assert on the database. Ask the `test-writer` agent.

## Verify

`pnpm --filter @next/core tsc`, `pnpm exec oxlint apps/core/src/jobs/<file>`, and the tests you added.
Locally, `pnpm --filter @next/core dev:local` exposes Bull Board so you can watch the job run.
