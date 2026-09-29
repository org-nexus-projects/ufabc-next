---
name: ship
description: Commit, push, and open a draft pull request for UFABC Next following the repo conventions (Conventional Commits with app scope, Portuguese PR template, extension changeset). Use when the user asks to commit, open a PR, or ship the current work.
disable-model-invocation: true
---

# Ship the current change

Only run this when the user asked for a commit or PR. Stop and report if any step fails.

## 1. Preconditions

- Not on `main` or `develop`. If you are, create `feat|fix|refactor|chore/<topic>` from the current HEAD.
- The `verify` skill ran for this change and passed, or its failures are reported to the user.
- `git status` shows only files that belong to this task. Do not stage unrelated changes; list them to the user.
- No secrets in the diff: `git diff --cached` must not contain tokens, passwords, `.env` values, or private keys.

## 2. Changeset (extension only)

If the diff touches `apps/extension/**` with a user-visible effect and `.changeset/` has no pending file for it,
run `cd apps/extension && pnpm changeset` (select only `@next/extension`, `patch` for fixes, `minor` for features)
or ask the user which bump they want.

## 3. Commit

Conventional Commits, English, imperative, scope = app or package:

```text
feat(core): add teacher summary endpoint
fix(container): keep review filters after navigation
refactor(core,container): move season helpers to @next/utils
chore: update agent harness
```

Body (optional) explains why, wrapped at 72 columns. Stage files by name, not `git add -A`.
Git hooks must run; never use `--no-verify`.

## 4. Push and open the PR

```bash
git push -u origin HEAD
gh pr create --draft --base main --title "<same as commit subject>" --body-file <file>
```

The body follows `.github/PULL_REQUEST_TEMPLATE.md`, in Portuguese:

```markdown
## Descrição

<o que muda e por quê, em 2-5 frases; decisões e trade-offs relevantes>

## Tickets relacionados

<links de issues ou "Nenhum">

## Como testar esse PR

1. <comandos exatos: pnpm ...>
2. <passos manuais: página, usuário, resultado esperado>
```

Mention in `Descrição` anything a reviewer must know: "Ask first" items touched (schema, auth, workflows,
dependencies), new public routes, deploy impact (a merge to `main` deploys core and the web app), and checks
you could not run.

## 5. Report

Give the user the PR URL and the list of checks that ran.
