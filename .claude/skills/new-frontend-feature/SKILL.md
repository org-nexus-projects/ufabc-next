---
name: new-frontend-feature
description: Workflow to build or change a screen, component, or data flow in apps/container (Vue 3, Vuetify, TanStack Vue Query, @next/services, MSW tests). Use when asked for UI work in the web app, including wiring a new API endpoint into a page.
---

# New feature in `@next/container`

Read `apps/container/ARCHITECTURE.md` and `apps/container/AGENTS.md` first. A good reference feature is
`apps/container/src/features/reviews/` with `pages/Reviews/`.

## 1. Place it

| What | Where |
| --- | --- |
| Route entry | `src/pages/<Name>/<Name>Page.vue` + route in `src/router/index.ts` |
| Business capability (components, composables, validation) | `src/features/<feature>/` |
| Reusable presentational component | `src/components/ui/<Name>/` |
| Framework-free domain logic | `src/shared/<topic>/` |
| HTTP call and response types | `packages/services/src/<domain>.ts` |

A feature never imports another feature. Components in `components/ui` take props and emit events only.

## 2. Data

1. Add or reuse the service method in `packages/services/src/<domain>.ts` with explicit request/response types
   that match the core response schema.
2. Wrap it in a composable in the feature, e.g. `useTeacherSummary(teacherId: Ref<string>)`, using
   `useQuery({ queryKey: ['teacherSummary', teacherId], queryFn: () => Service.method(teacherId.value) })`.
3. Mutations use `useMutation` and invalidate the affected query keys on success.
4. Handle loading, empty, and error states explicitly; reuse `CenteredLoading`, `FeedbackAlert`, `MFError`.

## 3. UI

- `<script setup lang="ts">`, typed `defineProps`/`defineEmits`, Vuetify components, Portuguese copy.
- Folder per component: `Name/Name.vue`, `Name/Name.test.ts`, `Name/index.ts`.
- Forms: vee-validate + Zod schema in `features/<feature>/validation/`.

## 4. Tests

- Mock the endpoint with MSW: add fixtures in `src/mocks/<domain>.ts` and a default handler in `src/mocks/handlers.ts`;
  override per test with `server.use(http.get(...))`.
- Render with `render` from `@/test-utils`; query by role or visible text; cover loading, success, empty, and error.
- Run `pnpm --filter @next/container exec vitest run src/features/<feature>`.

## 5. Verify

`pnpm --filter @next/container tsc`, `pnpm --filter @next/container lint` (read the output; exit code is always 0),
the tests above, and, for visual changes, run `pnpm dev:app` and check the page in a browser at desktop and mobile widths.
If `packages/services` changed, check its other consumers with `rg "@next/services" apps packages -g '!node_modules' -g '!**/node_modules/**'`.
