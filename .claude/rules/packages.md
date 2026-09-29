---
paths:
  - 'packages/**'
  - 'tools/**'
---

# Shared packages

- A change here reaches several apps. Check consumers with `rg "@next/<name>" apps packages -g '!node_modules'`
  and run `tsc` for each of them, not only for the package.
- `@next/logger` is consumed from `dist/`: rebuild it (`pnpm turbo run build --filter=@next/logger`)
  before type checking dependents.
- Keep exports explicit in `package.json` `exports`; adding a subpath export is part of the public API.
- Pushing to `main` with changes in `packages/db|queues|utils` redeploys the API; `packages/services|utils`
  redeploys the web app and runs the extension release workflow.
- Dependency versions come from the pnpm catalog in `pnpm-workspace.yaml`; use `catalog:` and ask before adding one.
