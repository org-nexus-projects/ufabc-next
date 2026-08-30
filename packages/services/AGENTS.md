# API client package

Scope: `packages/services`, the shared typed HTTP client consumed by the web portal.

## Client boundary

`api.ts` owns the Axios clients and authentication header setup. Keep endpoint modules and exported types aligned with the API contract.

## Contract changes

When a request or response changes, update the endpoint module, shared type, and each affected portal consumer together.

Do not move page-specific presentation or state into this package.
