---
paths:
  - 'apps/core/src/routes/**'
  - 'apps/core/src/queue/**'
  - 'apps/core/src/schemas/*.ts'
---

# Core legacy code

- This is maintenance-only code. Fix bugs here, but build new endpoints as v2 controllers and new jobs with
  `defineJob` in `apps/core/src/jobs/` (skills `new-v2-endpoint`, `new-background-job`).
- Routes here are authenticated by default through `routes/autohooks.ts`; only paths in `PUBLIC_ROUTES` skip JWT.
  Adding to `PUBLIC_ROUTES` is an "Ask first" change.
- Response shapes here are consumed by the web app and the extension. Do not rename or remove fields;
  add new ones and migrate consumers first.
- When you migrate a route to v2, keep the legacy route until every consumer (`apps/container`,
  `apps/extension`, `packages/services`) is switched, and say which consumers you checked.
