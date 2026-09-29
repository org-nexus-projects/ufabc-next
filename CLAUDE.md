@AGENTS.md

## Claude Code specifics

- Path-scoped rules in `.claude/rules/` load automatically when you touch matching files. Nested
  `CLAUDE.md` files in `apps/*` and `packages/` import each app's `AGENTS.md`.
- Invoke skills for multi-step work instead of improvising: `/new-v2-endpoint`, `/new-background-job`,
  `/new-frontend-feature`, `/data-model`, `/verify`, `/ship`.
- Delegate to subagents when their description matches: `code-reviewer` before opening a PR,
  `test-writer` for new tests, `debugger` for failures you cannot explain in one step,
  `security-reviewer` for auth, webhooks, uploads, or anything touching student data.
- Hooks format edited files, block secret access and destructive commands, and print repo status at session
  start. If a hook blocks you, read its reason and change approach; do not work around it.
- Personal overrides go in `CLAUDE.local.md` and `.claude/settings.local.json` (both git-ignored).
