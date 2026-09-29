---
paths:
  - '.github/**'
  - 'Dockerfile'
  - '**/docker-compose*.yml'
  - 'turbo.json'
  - 'pnpm-workspace.yaml'
  - '.changeset/**'
---

# CI, deploy, and workspace config

- Everything here is "Ask first". Workflows deploy to production on push to `main` (`deploy-core.yml`,
  `deploy-frontend.yml`) and publish the extension (`release-extension.yml`).
- Keep third-party actions pinned to a major version or SHA, never `@main`. Never echo secrets in `run:` steps.
- The `paths:` filters in deploy workflows decide what redeploys; update them when you add a package that an app consumes.
- `.changeset/*.md` may only list `@next/extension`; CI rejects other packages.
- Catalog versions in `pnpm-workspace.yaml` apply to every workspace. Changing one needs `pnpm install` and a
  type check of all consumers.
