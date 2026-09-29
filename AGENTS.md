# UFABC Next — Guide for AI Agents

UFABC Next helps UFABC students plan enrollments, review teachers and subjects,
and track their academic history. This is a pnpm + Turborepo monorepo that holds
the backend API, the web app, and the browser extension.

This file is the single source of truth for every coding agent (Claude Code,
Codex, Cursor, Zed, OpenCode). `CLAUDE.md` files only import it. Each app has
its own `AGENTS.md` with the details for that app; read it before editing there.

## Map

| Path                   | Package            | What it is                                                                  | Details                                                                  |
| ---------------------- | ------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `apps/core`            | `@next/core`       | Fastify 5 API, Mongoose (MongoDB), BullMQ jobs (Redis), AWS (S3, SES)       | [`apps/core/AGENTS.md`](apps/core/AGENTS.md)                             |
| `apps/container`       | `@next/container`  | Vue 3 + Vuetify SPA (Vite), TanStack Query, Pinia                           | [`apps/container/AGENTS.md`](apps/container/AGENTS.md)                   |
| `apps/extension`       | `@next/extension`  | WXT browser extension (Chrome/Firefox) injected into SIGAA, Matrícula, Moodle | [`apps/extension/AGENTS.md`](apps/extension/AGENTS.md)                 |
| `apps/static`          | —                  | Static HTML (privacy policy, terms of use)                                   | —                                                                        |
| `packages/*`           | `@next/*`          | Shared libraries: `connectors`, `db`, `logger`, `queues`, `services`, `testing`, `utils` | [`packages/AGENTS.md`](packages/AGENTS.md)                  |
| `tools/tsconfig`       | `@next/config`     | Shared tsconfig presets (`base`, `apps`, `libs`, `vue`)                     | —                                                                        |
| `tools/docker-infra`   | `@next/docker-infra` | Local MongoDB, Redis and LocalStack via `docker-compose.yml`              | —                                                                        |

Domain vocabulary (Portuguese names are kept in code and data):

- **RA**: student registration number; the main student key across collections.
- **season** / **quad**: academic period, `"<year>:<quad>"`, e.g. `"2025:1"` (UFABC has three quadrimestres per year).
- **disciplina** / **component**: a class offering in a season (collection `disciplinas`). **subject**: the catalog entry (`subjects`).
- **teoria** / **pratica**: the theory and practice teachers of an offering.
- **conceito**: final grade (`A`, `B`, `C`, `D`, `F`, `O`). **CR / CA / CP**: academic coefficients.
- **SIGAA**, **Matrícula**, **Moodle**: UFABC systems we read from. **ufabc-parser**: external service that scrapes them and calls our webhooks.

## Commands

Run everything from the repository root. Node `^24` (see `.nvmrc`) and pnpm `10.33.2` are enforced (`engineStrict`).

```bash
pnpm install                                   # install every workspace
pnpm dev:app                                   # web app only (Vite)
pnpm --filter @next/docker-infra up            # MongoDB + Redis + LocalStack for core
pnpm --filter @next/core dev:local             # API with tsx watch (needs apps/core/.env)
pnpm --filter @next/extension dev              # extension with hot reload

pnpm turbo run lint tsc --filter=<pkg>         # static checks for one package
pnpm turbo run build lint tsc --filter=...[origin/main]   # what CI runs on a PR
pnpm --filter @next/container test             # web app unit tests (Vitest + jsdom)
pnpm --filter @next/core exec vitest run       # API tests (Testcontainers: Docker must be running)
pnpm --filter @next/utils test                 # node:test suites
pnpm exec oxlint apps/core/src                 # core has no lint script; lint it directly
pnpm exec oxfmt <files>                        # format (oxfmt, single quotes)
```

- `lint` scripts end with `|| true`: a green exit code does **not** mean zero findings. Read the output.
- `pnpm --filter @next/core test` starts Vitest in watch mode; use `exec vitest run` in scripts and agents.
- Prefer the narrowest check that covers your change, then widen before you finish. The `verify` skill has the full ladder.

## Boundaries

### Always

- Read the app `AGENTS.md` and the files you will change before editing. Follow the patterns you find there.
- Keep diffs small and focused on the task. Match surrounding naming, comment density, and import style.
- Run lint, type check, and the relevant tests for every workspace you touched, and report failures verbatim.
- Validate external input with Zod at the boundary (HTTP schema, job input, webhook payload).
- Propagate `globalTraceId` through services, repositories, and jobs so logs stay correlated.
- Write commits as Conventional Commits with the app as scope: `fix(core): ...`, `feat(container): ...`, `refactor(core,container): ...`.

### Ask first

- Adding, removing, or upgrading dependencies (versions live in the pnpm catalog in `pnpm-workspace.yaml`).
- Changing a Mongoose schema, index, or hook, or writing a data migration/backfill.
- Changing auth, JWT, permissions, rate limits, CORS, or the `PUBLIC_ROUTES` list in `apps/core/src/routes/autohooks.ts`.
- Touching `.github/workflows/*`, `Dockerfile`, `docker-compose.yml`, or deploy configuration.
- Changing an API response shape or route consumed by `apps/container`, `apps/extension`, or other requesters (`REQUESTERS` in `apps/core/src/constants.ts`).
- Deleting files or code you did not write in this task.

### Never

- Read, print, or commit secrets: `apps/core/.env*` (except `.env.example`), `apps/extension/.env*`, `.gitsecret/keys/*`.
  `*.secret` files are git-secret ciphertext: never edit, decrypt, or regenerate them. The committed `apps/container/.env*` files are public build-time `VITE_*` values; never add a secret to them.
- Log PII (RA, email, names, tokens, session cookies) at `info` or above. Use `@next/logger/sanitize` when logging payloads.
- Edit generated files: `auto-imports.d.ts`, `components.d.ts`, `dist/`, `.output/`, `.wxt/`, `pnpm-lock.yaml` by hand.
- Use `as any` or `@ts-ignore` to silence the type checker; fix the type.
- Push to `main`/`develop`, force-push shared branches, or skip hooks (`--no-verify`).
- Weaken or delete a failing test to make a change pass.

## Conventions that apply everywhere

- TypeScript ESM. Lint is oxlint (`ultracite` preset), format is oxfmt with single quotes. Config: `oxlint.config.ts`, `oxfmt.config.ts`.
- Use `type` aliases, not `interface` (`typescript/consistent-type-definitions`). Use `import type` at the top level.
- Use function declarations (`func-style: declaration`), except in `*-controller.ts` and `hooks/*.ts`.
- Use `Array<T>` for complex element types and `T[]` for simple ones (`array-type: array-simple`).
- `===` everywhere; `== null` is allowed.
- Inside an app, import across folders with the `@/` alias. In `apps/core`, relative and `@/` imports end in `.js`.
- Comments explain *why*, never *what*. Do not add comments that restate the code.
- Constants shared inside core live in `apps/core/src/constants.ts`.

## Git and pull requests

- Branch from `main`: `feat/<topic>`, `fix/<topic>`, `refactor/<topic>`, `chore/<topic>`.
- PR descriptions follow `.github/PULL_REQUEST_TEMPLATE.md` and are written in Portuguese: `Descrição`, `Tickets relacionados`, `Como testar esse PR`.
- Open PRs as drafts unless asked otherwise. One concern per PR; split refactors from behavior changes.
- Changes to `apps/extension` that ship to users need a changeset (`cd apps/extension && pnpm changeset`). Only `@next/extension` is allowed in `.changeset/*.md`.
- Pushes to `main` deploy: `apps/core` (plus `packages/db|queues|utils`) to the API; `apps/container` (plus `packages/services|utils`) to S3/CloudFront, also on `develop`; `apps/extension` to the stores when a changeset is present.

## Agent harness

Claude Code configuration lives in `.claude/` and is documented in [`.claude/README.md`](.claude/README.md):

- **Rules** (`.claude/rules/`): short, path-scoped rules loaded when you work on matching files.
- **Skills** (`.claude/skills/`): step-by-step workflows, e.g. `new-v2-endpoint`, `new-background-job`, `new-frontend-feature`, `data-model`, `verify`, `ship`.
- **Subagents** (`.claude/agents/`): `code-reviewer`, `test-writer`, `debugger`, `security-reviewer`.
- **Hooks** (`.claude/hooks/`): format on edit, block dangerous shell commands and secret access, session context.

Other agents can read the skills and rules as plain Markdown; the workflows apply to them too.

## When stuck

- Search for an existing example first: `rg "defineJob\(" apps/core/src/jobs`, `rg "FastifyPluginAsyncZod" apps/core/src/controllers`.
- Read `apps/container/ARCHITECTURE.md` for the web app layering and `packages/queues/README.md` for jobs.
- If requirements are unclear or a change needs an "Ask first" item, stop and ask instead of guessing.
