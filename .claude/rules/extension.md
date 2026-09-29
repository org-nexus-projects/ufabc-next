---
paths:
  - 'apps/extension/**'
  - 'packages/connectors/**'
---

# Browser extension (WXT)

- Content scripts run inside SIGAA, Matrícula, and Moodle pages we do not control. Selectors break when
  UFABC changes markup: guard every query, fail quietly, and never throw into the host page.
- Talk to background through the typed messaging `ProtocolMap`; do not add ad-hoc `chrome.runtime` messages.
- New host permissions or `permissions` in `wxt.config.ts` trigger a store review and a user prompt. Ask first.
- Student data scraped from UFABC systems (RA, grades, history) goes only to the UFABC Next API. Never log it.
- There are no automated tests here. Verify with `pnpm --filter @next/extension compile` and describe the manual
  test (browser, page, steps) in the PR.
- User-facing changes need a changeset: `cd apps/extension && pnpm changeset` (patch/minor for `@next/extension` only).
