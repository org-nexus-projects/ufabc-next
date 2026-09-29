# `packages/*` — Shared libraries

Internal workspace packages consumed with `workspace:*`. Read the root [`AGENTS.md`](../AGENTS.md) first.

| Package              | Used by                  | Entry points                                                                 | Notes                                                                                   |
| -------------------- | ------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `@next/logger`       | core, container, extension, connectors | `./server`, `./browser`, `./sanitize` (built to `dist/` by tsdown) | Pino on the server, Axiom transport. **Must be built** before dependents type check. |
| `@next/db`           | core                     | `./models`, `./queries`, `./client`                                          | `student_sync` and `history_processing_jobs` models. Other models live in `apps/core/src/models`. |
| `@next/queues`       | core                     | `./client` (`defineJob`), `./manager` (`JobManager`)                         | BullMQ builder. Usage guide: [`queues/README.md`](queues/README.md).                   |
| `@next/utils`        | core                     | `index.ts`                                                                   | Season/quad math, identifiers, coefficients. Tests with `node:test`.                   |
| `@next/services`     | container                | `index.ts`                                                                   | Axios client for the web app. One file per domain in `src/`, types in `src/types/`.    |
| `@next/connectors`   | extension                | `./ufabc-parser`, `./sigaa`, `./moodle`, `./next-api`, `./schemas/*`, ...     | External HTTP clients with Zod schemas. Core keeps its own copies in `apps/core/src/connectors`. |
| `@next/testing`      | core (tests)             | `./containers`, `./factories`, `./mocks`, `./methods`                        | Testcontainers stack (MongoDB, Redis, LocalStack), nock mocks, queue helpers.          |

## Rules

- A package never imports from `apps/*`.
- Changing an export's signature is a cross-app change: find every consumer first
  (`rg "@next/<pkg>" apps packages`) and update them in the same PR.
- Adding an entry point means updating `exports` in the package's `package.json`.
- Dependency versions come from the pnpm catalog (`catalog:` in `package.json`, values in `pnpm-workspace.yaml`).
- `@next/services` reads `VITE_*` env vars and runs only in the browser build.
- Changes to `packages/db`, `packages/queues`, or `packages/utils` redeploy the API on merge;
  `packages/services` and `packages/utils` redeploy the web app; `packages/services` and `packages/utils`
  also trigger the extension release workflow.

## Commands

```bash
pnpm turbo run tsc --filter=@next/<pkg>       # type check (builds dependencies first)
pnpm exec oxlint packages/<pkg>/src           # lint
pnpm --filter @next/utils test                # node:test suites in lib/*.spec.ts
pnpm turbo run build --filter=@next/logger    # rebuild logger dist after editing it
```
