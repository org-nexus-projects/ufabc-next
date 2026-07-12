# Changesets

This repo uses [changesets](https://github.com/changesets/changesets) to track
pending releases. Only `@next/extension` is auto-released — other packages may
be referenced but never appear in the published changelog.

## Adding a changeset

Run, while working on `apps/extension`:

```
pnpm changeset
```

Answer the prompts:

- **Which packages?** select only `@next/extension`
- **Bump type?** `major` / `minor` / `patch`
- **Summary?** one line the user will read in `apps/extension/CHANGELOG.md`

This writes a file like `.changeset/<random-name>.md`. Commit it alongside the
code change. The release workflow consumes it on dispatch.

## Release flow

`.github/workflows/release-extension.yml` is triggered manually via `workflow_dispatch`
(with optional `dryRun`). It:

1. Validates every pending changeset only touches `@next/extension`
2. Runs `pnpm changeset version` (bumps `apps/extension/package.json`, writes
   `apps/extension/CHANGELOG.md`, removes consumed `.changeset/*.md`)
3. Builds + zips the extension
4. Commits, tags `extension-v<version>`, pushes
5. Creates a GitHub Release and attaches the Chrome zip
6. Submits to the Chrome Web Store

`dryRun=true` skips steps 4–6 — it only builds and uploads the artifact so you
can inspect the zip.