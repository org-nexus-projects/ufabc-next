# Agent harness

Configuration that makes AI coding agents productive and safe in this monorepo. The instructions themselves live
in [`AGENTS.md`](../AGENTS.md) (root and per app) so every tool reads the same text; this folder adds
Claude Code specifics on top. Skills, rules, and agent prompts are plain Markdown, so Codex, Cursor, and others can read them too.

## Layout

| Path | What | Loaded |
| --- | --- | --- |
| `AGENTS.md`, `apps/*/AGENTS.md`, `packages/AGENTS.md` | Map, commands, boundaries, conventions | Always (via `CLAUDE.md` imports) |
| `rules/*.md` | Short rules scoped by `paths:` globs | When Claude touches a matching file |
| `skills/<name>/SKILL.md` | Step-by-step workflows | On demand, by description or `/<name>` |
| `agents/*.md` | Subagents with their own context and tools | When delegated to |
| `hooks/*.mjs` | Guards and automation (Node, no dependencies) | On tool events, see `settings.json` |
| `scripts/*.mjs` | Checks for changed code and for this harness | Run by agents, skills, or you |
| `settings.json` | Shared permissions and hook wiring | Always |

## Skills

| Skill | Use for |
| --- | --- |
| `new-v2-endpoint` | API route in `apps/core` (schema, service, `NextError`, controller, test) |
| `new-background-job` | BullMQ job with `defineJob`, registry, idempotency |
| `new-frontend-feature` | Page/component/data flow in `apps/container` |
| `data-model` | MongoDB collections, relationships, indexes, hooks ([collections.md](skills/data-model/collections.md)) |
| `verify` | Lint, format, type check, tests for what changed, and the repo's false greens |
| `ship` | Commit, changeset, push, draft PR with the Portuguese template (manual: `/ship`) |

## Subagents

| Agent | Tools | Use for |
| --- | --- | --- |
| `code-reviewer` | read-only | Adversarial review before a PR |
| `security-reviewer` | read-only | Auth, webhooks, uploads, extension permissions, PII, CI secrets |
| `test-writer` | edit + bash | Integration/unit tests in the repo's patterns |
| `debugger` | edit + bash | Root cause of failures, with a table of known causes |

## Hooks

| Hook | Event | Behavior |
| --- | --- | --- |
| `session-start.mjs` | SessionStart | Prints branch status and warns about wrong Node, missing install, unbuilt `@next/logger`, missing `apps/core/.env`, Docker down |
| `guard-bash.mjs` | PreToolUse `Bash` | **Denies** reading secrets, `git secret reveal`, `--no-verify`, force push, push to `main`/`develop`, publishing. **Asks** before `reset --hard`, `clean -f`, recursive `rm` outside build output, `docker compose down -v`, dependency changes, `gh pr merge`, Mongo deletes |
| `protect-files.mjs` | PreToolUse `Read`/`Grep`/edits | Denies access to secret files and edits to generated files and git-secret ciphertext |
| `format-on-edit.mjs` | PostToolUse edits | Runs `oxfmt` on the edited file if it is new or was already formatted, so legacy files do not get whitespace-only diffs |

Hooks are a safety net, not a sandbox: they catch common mistakes, and `permissions.deny` in `settings.json`
backs up the secret rules. Review what an agent runs.

## Scripts

```bash
node .claude/scripts/check-changed.mjs     # lint/format findings on changed lines + next commands per workspace
node .claude/scripts/validate-harness.mjs  # frontmatter, rule globs, referenced paths, links, hook scripts
node --test .claude/hooks/hooks.test.mjs   # regression tests for guard-bash and protect-files
```

## Maintaining it

- When code moves, run `validate-harness.mjs`; it fails on paths the docs mention that no longer exist.
- Changing a hook? Add a case to `hooks/hooks.test.mjs` first.
- Prefer fixing `AGENTS.md` over adding a rule; add a rule only when the guidance applies to specific paths.
- Keep skills procedural (steps, commands, reference files) and rules short (a few bullets).
- Personal preferences go in `CLAUDE.local.md` or `.claude/settings.local.json`, both git-ignored.
