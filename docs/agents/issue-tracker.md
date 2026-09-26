# Issue tracker: GitHub

Issues and specs for this repository live in GitHub Issues. Use the `gh` CLI for operations and infer the repository from `git remote -v`.

## Conventions

- Create: `gh issue create --title "..." --body "..."`
- Read: `gh issue view <number> --comments`
- List: `gh issue list --state open`
- Comment: `gh issue comment <number> --body "..."`
- Close: `gh issue close <number> --comment "..."`
- Apply labels: `gh issue edit <number> --add-label "..."`
- Remove labels: `gh issue edit <number> --remove-label "..."`

Use heredocs for long issue bodies.

## Pull requests as a request surface

PRs as a request surface: no.

Pull requests are not automatically treated as incoming feature requests or triage items.

## Skill vocabulary

When a skill says “publish to the issue tracker”, create a GitHub issue.

When a skill says “fetch the relevant ticket”, read the corresponding issue and its comments.

## Blocking relationships

Prefer GitHub native issue dependencies. When unavailable, add a `Blocked by: #<number>` line near the top of the issue body.

An issue is ready for implementation only when all of its blockers are closed.

## Public writes

Before creating or commenting on a public issue, read `docs/agents/public-repository.md`.
