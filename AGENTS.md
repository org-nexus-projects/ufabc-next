# AGENTS.md

## Scope

These instructions apply to the whole `ufabc-next-web` repository.

This is a pnpm/Turborepo monorepo. The main app is `apps/container`, a Vue 3 SPA built with Vite. Shared API clients live in `packages/services`, shared lint rules live in `packages/eslint-config-custom`.

## Commands

- Run shell commands with `rtk`, as required by the included global instructions.
- Use pnpm from the repository root. The expected toolchain is Node 20.19.x and pnpm 10.28.x.
- Common checks:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm tsc`
  - `pnpm build`
- For app-only work, prefer package-scoped scripts when practical:
  - `pnpm --filter ufabc-next-web-container lint`
  - `pnpm --filter ufabc-next-web-container test`
  - `pnpm --filter ufabc-next-web-container type-check`
  - `pnpm --filter ufabc-next-web-container build`
- For package-only work, use the package scripts that actually exist:
  - `pnpm --filter @ufabc-next/services lint`
  - `pnpm --filter @ufabc-next/services tsc`

- If you add or read new environment variables, update the relevant `turbo.json` task `env` list for `build`, `build:staging`, and/or `dev`. Code currently reads Vite-style variables such as `VITE_APP_ENV`, `VITE_APP_BASE_URL`, and `VITE_MIXPANEL_TOKEN`; do not copy stale `VUE_APP_*` names into new code.

## Repository Patterns

- Keep application code in English. User-facing product copy is mostly Portuguese and should stay natural for UFABC students.
- Prefer existing project libraries before adding new dependencies: Vue 3, Vuetify 3, Element Plus, TanStack Vue Query, Pinia, vee-validate, zod, VueUse, dayjs, Highcharts/highcharts-vue, amCharts, `ics`, Mixpanel, `lodash.debounce`, Testing Library, Vitest, and MSW.
- Use `@/` for imports inside `apps/container/src`.
- The `apps/container/src/` folder follows a **feature-based architecture** with these layers:
  - `pages/` — thin page entry points (renamed from `views/`). Each page lives in its own folder.
  - `features/` — vertical slices by domain. Domain components, types, and utilities belong here.
  - `components/ui/` — truly shared UI primitives used by 2+ features (e.g., `PaperCard`, `FeedbackAlert`).
  - `components/layout/` — layout-specific components (e.g., `AppBar`).
  - `composables/` — cross-cutting composables shared across the app.
  - `config/` — third-party library configuration (e.g., Vuetify themes, Highcharts).
  - `helpers/` — generic pure functions and event tracking.
  - `utils/` — ONLY generic, pure utility functions (no domain logic).
  - `stores/` — Pinia stores for global/session state.
- Keep API calls out of Vue components. Add or adjust endpoint wrappers in `packages/services/src`, and add shared response/request types in `packages/types/src` when they are reused across the app. When adding new modules, update the matching barrel export in `packages/services/src/index.ts` or `packages/types/src/index.ts`.
- Do not create frontend mock backends when the real backend owns the endpoint. Link the backend PR/API route and adapt the frontend to that contract.
- Treat `apps/static` as static HTML/assets. Do not assume Vue components, composables, or Vuetify are available there.
- Preserve Vite routing assumptions: local dev runs at port `3000`, production app assets are served under `/app`, and router history uses `import.meta.env.VITE_APP_BASE_URL`.
- Route changes must preserve the existing auth conventions: route meta uses `confirmed`, `auth`, and `layout: 'include-sidebar'`; token auth can arrive through `?token=`; unauthenticated redirects intentionally differ between local dev and production.

## Architecture Rules

These rules govern how code is organized in the feature-based folder structure.

### Feature Isolation

**Features never import from other features.** If a component/composable/utility is used by 2+ features, it must be promoted to a shared layer (`components/ui/`, `composables/`, `helpers/`, or `utils/`).

### Page Orchestration

**Pages may import from features.** Pages are thin coordinators that compose features. They can import from any feature. Pages may also import from `components/ui/`, `composables/`, `helpers/`, `utils/`, and `stores/`.

### Auth is Infrastructure

`features/auth/` is treated as infrastructure, not a business domain. Pages may import from `features/auth/` (e.g., `UserMenu`, validation schemas). Business features (`reviews`, `whatsapp`, `calengrade`) **must not** import from `features/auth/`. They access auth state via the global `stores/auth.ts` Pinia store.

### Import Conventions

- **Inside the same feature:** use relative paths (`../SearchBar` or `./Foo`).
- **Outside a feature:** use absolute paths via `@/` (`@/features/reviews/components/SearchBar`).
- **Global/shared imports:** use `@/components/ui/PaperCard`, `@/composables/aliasInitials`, `@/stores/auth`, etc.

### Barrel Exports

Every component folder has an `index.ts` that re-exports the `.vue` file:

```ts
export { default as ComponentName } from './ComponentName.vue';
```

### Domain Utilities Belong to Features

If a utility function is used by a single feature, it lives inside that feature's `utils/` folder. Generic utilities stay in `src/utils/`.

## Vue And TypeScript

- Follow Vue 3 Composition API with `<script setup lang="ts">`.
- Prefer TypeScript types for props and emits:
  - `defineProps<Props>()`
  - `withDefaults(defineProps<Props>(), defaults)` for optional props with defaults
  - `defineEmits<{ close: []; update: [value: string] }>()` using named tuples
  - `defineModel<T>()` or named `defineModel<T>('field')` for new two-way bindings
- As a project convention, do not destructure props directly. Keep `const props = defineProps<...>()` and derive values with `computed` when needed.
- Prefer `computed` for derived, read-only state. Use `ref` for mutable local state, and `shallowRef` for large or external objects when deep reactivity is unnecessary.
- Keep route state idiomatic. Use `useRoute` and `useRouter` from `vue-router` instead of reading route params/query from `window.location`.
- When state depends on route query or another narrow source, name it specifically. For example, prefer names like `componentSelectedByQueryUrl` over generic names like `selectedComponent`.
- Extract reusable cross-component behavior into composables under `apps/container/src/composables` when logic spans components, especially theme/localStorage interactions or repeated formatting. Name composables as `useXxx`; when they return derived read-only state, prefer `computed`/readonly values over mutable refs.
- Keep watchers narrow and intentional. Prefer `computed` when a value can be derived without side effects. Async watchers/effects must clean up cancellable requests, timers, and subscriptions with Vue watcher cleanup APIs.
- Use Vue built-ins intentionally: `<Transition>`/`<TransitionGroup>` for Vue-managed animation, `<Teleport>` for out-of-tree UI when Vuetify is not handling it, `<Suspense>` only for async setup/top-level await, `<KeepAlive>` only when preserving component state is intentional, and `v-memo`/`v-once` only for measured render pressure.
- Avoid leaving temporary comments, debug logs, or TODOs unless they describe a real follow-up that cannot be solved in the current change.

## Data Fetching And State

- Use TanStack Vue Query for server state and cacheable API reads. Keep query keys stable and specific.
- Use Pinia for authenticated user/session state and app state that must be shared across views.
- Keep `packages/services` focused on request wrappers and API response typing. Form validation and user-facing error handling usually belong in the view/form layer with `vee-validate`, zod schemas, and local UI state.
- Tests should use `apps/container/src/test-utils.ts` so Vuetify, Element Plus, and Vue Query are installed consistently.
- `test-utils.ts` does not install Pinia or router globally. Auth/store-heavy tests should create Pinia state intentionally, and route-heavy tests should install or mock `vue-router` intentionally.
- In tests, prefer MSW handlers over mocking implementation details of service functions when testing UI behavior around requests.
- Handle loading, empty, and error states explicitly for user-facing flows.
- Be careful with chained API calls. Recent reviews called out performance degradation from sequential parser calls; cache or reuse data when the response is common and stable.

## UI, Copy, And Accessibility

- Use Vuetify components and project components such as `PaperCard`, `FeedbackAlert`, `CenteredLoading`, and existing cards before creating one-off UI.
- Keep visual changes easy to review. For UI PRs, include screenshots or videos and explain the tested state, especially logged-in versus logged-out flows.
- Copy should make the user action clear. Recent reviews favored explicit button labels and explanatory notices when login behavior changed.
- Avoid ambiguous control labels. Filter and toggle text should describe the resulting behavior, such as `Ocultar EAD` or `Incluir EAD`, instead of a label that can mean the opposite.
- Important auth/login behavior changes should not rely only on a tooltip. Prefer a short visible notice or notification pattern, and keep the primary button label explicit.
- Avoid cluttering screens with long inline explanations. If text makes the layout noisy, prefer a notification/alert pattern or a concise helper message.
- Use icons from the existing icon stack (`mdi-*`) inside Vuetify components.
- Preserve responsive behavior. Check desktop and mobile layouts when changing cards, tables, dialogs, filters, or dropdown-heavy flows.
- Images need useful `alt` text. Icon-only buttons need an accessible label when the visible label is absent.

## Tests And Verification

- Add or update tests for behavior that can regress, not only render snapshots. Reviews explicitly asked for tests that preserve component behavior through future changes.
- Use Testing Library queries that match user-visible behavior: roles, labels, text, placeholders, and interactions through `userEvent`.
- Use `waitFor` or `findBy*` for async UI driven by Vue Query, router updates, dialogs, or MSW responses.
- For changes touching auth, login, route guards, signup, recovery, or backend contracts, test both success and failure paths when practical.
- For features that depend on an external API or backend session, do not mark the work ready on local UI checks alone. Verify the integrated frontend-to-API path or document exactly who/what is blocking that validation.

## PR Expectations

- Fill the PR template sections: description, related tickets, and how to test.
- Include concrete evidence for visual or behavioral changes. The team often asks for screenshots, videos, or a short note confirming the exact scenario tested.
- Evidence should reflect the latest pushed state, not an earlier implementation. Name the scenario tested and call out dev-data caveats such as unavailable mock groups.
- Mention whether the test covered logged-in and logged-out states when the feature behaves differently by auth state.
- If a change affects backend/API behavior, point to the related backend PR or API change when one exists.
- Keep changes focused. If the core fix belongs in `packages/services`, put it there and keep view changes limited to adapting to the fixed contract.
- Before handoff, remove temporary review artifacts: debug comments, leftover console output, dead branches, unused imports, POC/test files, generated artifacts, unused dependencies/types, sample templates, and unjustified `eslint-disable`s.
