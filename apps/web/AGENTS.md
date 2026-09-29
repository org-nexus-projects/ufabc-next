# Web portal

Scope: `apps/web`, the Vue and Vite portal.

## Change path

Before changing a user flow, identify its route, view, local state or query, and API service.

## API boundary

Use `@next/services` for portal API calls. Keep request, response, and shared API-type changes in `packages/services` with their consuming portal code.

Use `Vue component` for a visual component and `Component` for the academic domain entity.
