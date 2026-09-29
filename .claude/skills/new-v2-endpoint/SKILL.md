---
name: new-v2-endpoint
description: Step-by-step workflow to add or change an HTTP endpoint in apps/core using the v2 pattern (Zod schema, FastifyPluginAsyncZod controller, BaseService, NextError, integration test). Use when asked to create an API route, expose data to the web app or extension, or migrate a legacy route to v2.
---

# New v2 endpoint in `@next/core`

Reference implementation: `GET /v2/teachers/:teacherId/summary`
(`controllers/teacher-summary-controller.ts`, `services/teacher-summary-service.ts`,
`mappers/teacher-summary-mapper.ts`, `schemas/v2/teacher-summary.ts`,
`tests/integration/entities/teachers/summary.spec.ts`). Read those five files first.

## 1. Pin down the contract

Write down before coding: method and path, who calls it (web app, extension, `ufabc-cronos`, webhook),
auth (JWT user, admin, session, webhook signature, or public), input, response per status code, and errors.
If the route replaces a legacy one, list the consumers you must keep working (`rg "<path>" apps packages -g '!node_modules'`).
A new public route or a changed response shape is an "Ask first" item.

## 2. Schema — `apps/core/src/schemas/v2/<resource>.ts`

- Zod schemas for `params`, `querystring`, `body`, and every response. Export them; tests and the web app types may reuse them.
- Use `z.string().regex(...)` or a shared helper for ObjectIds; coerce query numbers with `z.coerce.number()`.
- The response schema lists exactly the fields the client needs. Fields not listed are stripped.

## 3. Service (and mapper) — `apps/core/src/services/<resource>-service.ts`

- `export class XService extends BaseService`, constructor `(options: BaseServiceOptions = {})` calling `super(options)`.
- Query with models (or a repository extending `BaseRepository` when the query is reused). Use `.lean()`.
- Shape documents into the response in a mapper class under `mappers/`.
- Log with `this.logger` at `debug`/`info` without PII. Return `null` for "not found"; let the controller decide the error.
- Use the `data-model` skill before writing non-trivial queries.

## 4. Errors — `apps/core/src/errors/custom-errors.ts`

Add a `NextError` subclass only when no existing one fits. Take the next free code
(`rg -o "NEX[0-9]{4}" apps/core/src/errors | sort | tail -1`), an HTTP status, an English description, and a
Portuguese `translatedDescription` that a student can read.

## 5. Controller — `apps/core/src/controllers/<resource>-controller.ts`

```ts
export const xController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/resources/:id',            // relative: /v2 is added by setupV2Routes
    preHandler: [jwtVerifyHook],      // omit only for a deliberately public route
    schema: { params: paramsSchema, response: { 200: responseSchema } },
    handler: async (request) => {
      const result = await new XService().find(request.params.id);
      if (!result) throw new XNotFound(request.params.id);
      return result;
    },
  });
};
```

Register it in `routesV2` in `apps/core/src/app.ts`. For caching use `app.cache<T>()` created once per plugin
(see the reference controller) and pick keys that include every input.

## 6. Test — `apps/core/tests/integration/<area>/<resource>.spec.ts`

Delegate to the `test-writer` agent or copy the reference test. Cover at least: unauthenticated (401),
invalid input (400), not found (the new `NEX` code), and the happy path with the exact response body.
Response-schema tests catch accidental data exposure: assert that private fields are absent.

## 7. Consumers

If the web app or extension will call it, add the method and its types to `packages/services/src/<domain>.ts`
and follow `new-frontend-feature` for the UI.

## 8. Verify

Run the `verify` skill. At minimum:
`pnpm --filter @next/core tsc`, `pnpm exec oxlint <changed files>`, and
`pnpm --filter @next/core exec vitest run tests/integration/<your spec>` (Docker running).
