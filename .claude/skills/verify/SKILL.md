---
name: verify
description: Verification ladder for UFABC Next changes - lint, format, type check, and tests scoped to what changed, with the known false-greens of this repo. Use before saying a task is done, before committing, and when asked to "check", "validate", or "run the tests".
---

# Verify a change

Do not claim a change works until the checks below ran and you read their output. Report failures verbatim,
and say which checks you could not run (for example, Docker not running) instead of skipping them silently.

## 1. What changed

```bash
node .claude/scripts/check-changed.mjs            # against origin/main; --base <ref> to change
```

It prints oxlint findings on the lines you changed (the repo has thousands of older findings; ignore those),
files that need `pnpm exec oxfmt`, and the type check and test command for each touched workspace.
It exits 1 when your lines have lint findings or formatting drift. Fix them, then rerun.

## 2. Type check each touched workspace

| Workspace | Command | Notes |
| --- | --- | --- |
| `@next/core` | `pnpm turbo run tsc --filter=@next/core` | Turbo builds `@next/logger` and other deps first (`tsc` depends on `^build`) |
| `@next/container` | `pnpm turbo run tsc --filter=@next/container` | `vue-tsgo` |
| `@next/extension` | `pnpm --filter @next/extension compile` | Fails on `main` already (~10 errors); diff the `error TS` lines against `main` |
| `packages/*` | `pnpm turbo run tsc --filter=...<pkg>` | The leading `...` also checks every workspace that depends on it |

## 3. Tests

| Workspace | Command |
| --- | --- |
| `@next/core` | `pnpm --filter @next/core exec vitest run <spec path>` then the whole suite. Docker must be running. |
| `@next/container` | `pnpm --filter @next/container exec vitest run <folder>` then `pnpm --filter @next/container test` |
| `@next/utils` | `pnpm --filter @next/utils test` |
| `@next/extension` | No automated tests. Describe the manual check (browser, page, steps). |

Prefer `exec vitest run` for core: its `test` script is bare `vitest`, which enters watch mode in an interactive terminal.

## 4. Before opening a PR

Run what CI runs for the affected graph:

```bash
pnpm turbo run build lint tsc --filter=...[origin/main]
```

## False greens in this repo

- `lint` scripts end in `|| true`, so exit code 0 means nothing. Read the findings for your files.
- `turbo` may replay a cached result; `--force` reruns a task when you suspect the cache.
- A core test that passes without Docker was skipped or never started the stack. Check the output for the test count.
- `pnpm --filter <pkg> tsc` skips the dependency build that `turbo run tsc` does, so it can check against a stale
  `@next/logger` `dist/`. Prefer the turbo form.

## Report

End with a short list: each command, pass/fail, and anything not run with the reason.
