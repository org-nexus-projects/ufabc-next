When changing public-facing behavior, check README.md to see if the documentation needs updating.

## Validation

Validation — before completing a workspace-wide change, run `pnpm validate`. It runs every available lint, type check, test, and build task and continues to report all failures.

## Agent skills

### Issue tracker

Issue work — before reading, creating, or updating GitHub Issues, read `docs/agents/issue-tracker.md`.

### Domain docs

Domain changes — before changing a behavior, term, data model, or business rule, read `docs/agents/domain.md`.

## Area instructions

Before editing files in an area, read its local `AGENTS.md`:

- `apps/web/AGENTS.md` — portal Vue.
- `apps/core/AGENTS.md` — API e processamento.
- `apps/extension/AGENTS.md` — extensão.
- `apps/static/AGENTS.md` — páginas públicas.
- `packages/services/AGENTS.md` — cliente HTTP e contratos consumidos pelo portal.

## Public changes

Public boundary — before placing information in the repository or sending it to GitHub, read `docs/agents/public-repository.md`.
