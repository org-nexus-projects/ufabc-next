## Goal

Be productive in the UFABC Next backend monorepo. This document gives concise, actionable guidance for automated coding agents (Copilot-style) so changes are consistent with the project's structure, conventions, and developer workflows.

## Quick overview

- Monorepo managed with Turbo (root `package.json` scripts). Primary app: `apps/core` (Fastify API). Shared utilities in `packages/common` and `packages/tsconfig`.
- Runtime: Node.js 22. Package manager: pnpm (workspaces).
- Key startup flows: `pnpm i` at repo root, `pnpm build` (turbo run build), then `pnpm dev` for development (starts services via Docker Compose and runs apps in parallel).

## Files and locations you will reference often

- App root: `apps/core/` — main server files: `src/app.ts`, `src/server.ts`.
- Plugins: `apps/core/src/plugins/external/*` and `apps/core/src/plugins/custom/*` (autoloaded by Fastify).
- Routes: `apps/core/src/routes/**` (autoloaded, uses autoHooks and cascadeHooks).
- Config schema: `apps/core/src/plugins/external/config.ts` (zod schema + fastify-env integration). Use this to find environment flags and defaults.
- Shared helpers: `packages/common/lib/*` (small utilities and tests).
- Docker/dev services: root `docker-compose.yml` (used indirectly by `pnpm dev` via `services:up`).

## Architecture and patterns (concrete)

- Fastify with autoload: Plugins are separated into `external` (third-party wrappers + infra) and `custom` (application plugins like authorization, queue, token-generator). Use `fastifyAutoload` when adding new plugins and follow existing plugin initialization style (see `apps/core/src/app.ts`).
- Job / Worker system: There is a queue/worker abstraction in `apps/core/src/queue/*` and jobs scheduled in `server.ts` via `app.job.schedule(... )`. When adding background tasks, register them under `queue/jobs` and wire up `Worker.ts`/`Job.ts` types.
- Config/Env: `config.ts` defines the zod schema; environment variables are accessed on `app.config`. Respect defaults and `.env.dev` values when writing code that uses config flags (e.g., `USE_LOCALSTACK`, `AWS_BUCKET`, `WEB_URL`).
- Error handling: `app.setErrorHandler` and special handling for zod validation/serialization errors is centralized in `app.ts`. Return structured errors with status codes consistent with current handlers (422 for validation, 500 for serialization/internal).
- Routes auto-loading: Routes are auto-registered and use zod + zod-openapi for validation/serialization. Place route files under `routes/` and avoid names matching `test|spec|service` to prevent ignorePattern.

## Conventions and style (concrete)

- TypeScript, ES modules, `import.meta.dirname` for paths. Use named exports compatible with surrounding code.
- Prefer existing utilities in `packages/common` (e.g., `calculateCoefficients`, `identifier`) over adding new helpers unless necessary.
- When adding environment variables, update `apps/core/.env.example` and the zod `config.ts` schema in tandem.

## Developer workflows (commands you may need)

- Install deps: `pnpm i` (root)
- Build monorepo (makes internal workspaces available): `pnpm build` (runs turbo build)
- Start dev (brings up local services via Docker Compose then apps): `pnpm dev`
- Run `apps/core` dev only: `pnpm --filter @next/core dev` or `pnpm -w --filter @next/core dev` from repo root
- Run core tests: `pnpm --filter @next/core test` (root turbo delegator)

## Integration points and external systems

- MongoDB: connection string `MONGODB_CONNECTION_URL` (default to local `mongodb://127.0.0.1:27017/ufabc-matricula`). Init scripts live under `scripts/docker/mongo/initdb.d`.
- Redis: `REDIS_CONNECTION_URL` for queue/backing store.
- AWS/Localstack: `USE_LOCALSTACK` flag toggles usage; AWS creds and S3/Ses clients are used in `apps/core/src/lib/aws.service.ts`. Localstack helper scripts available in `scripts/docker/localstack`.
- Notion: integration via `apps/core/src/lib/notion.service.ts` with `NOTION_INTEGRATION_SECRET` and `NOTION_DATABASE_ID`.

## When making changes, follow this checklist

1. Update or confirm env vars in `apps/core/src/plugins/external/config.ts` and `apps/core/.env.example` if you add a new variable.
2. Prefer adding plugins under `plugins/custom` and register them via autoload; new plugin filename should export a Fastify plugin.
3. Add route files under `routes/` and use zod schemas for validation/serialization. If the route is internal to jobs, place under `routes/` with appropriate access controls.
4. If modifying data models, check corresponding seed/init scripts under `scripts/docker/mongo/initdb.d`.
5. Run `pnpm build` then `pnpm --filter @next/core test` and fix failing tests before opening PR.

## Examples (copy/paste friendly)

- Read a config value:

```ts
const bucket = app.config.AWS_BUCKET;
```

- Register an autoloaded plugin (follow existing style):

```ts
// apps/core/src/plugins/custom/myPlugin.ts
import { fastifyPlugin as fp } from "fastify-plugin";

export default fp(async function (app) {
  // use app.log, app.decorate, etc.
});
```

## What to avoid

- Don't change global tooling (turbo, pnpm, biome) without a clear repo-wide reason. Small, localized edits are preferred.
- Don't assume runtime environment — always read values from `app.config` and respect zod defaults.

If anything above is unclear or you'd like me to expand a section (jobs/queue, plugin lifecycle, or deployment notes), tell me which area and I'll iterate.
