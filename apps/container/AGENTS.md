# `@next/container` — Web app

Vue 3 SPA built with Vite, Vuetify 3, TanStack Vue Query, Pinia, and vee-validate + Zod.
It talks to `@next/core` through the typed Axios client in `packages/services` (`@next/services`).
Read the root [`AGENTS.md`](../../AGENTS.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md) first;
`ARCHITECTURE.md` is the authority on layering.

## Commands

```bash
pnpm dev:app                                   # vite, .env (local)
pnpm dev:app:staging                           # vite --mode staging, .env.staging
pnpm --filter @next/container tsc              # vue-tsgo type check
pnpm --filter @next/container lint             # oxlint (exit code is always 0; read the output)
pnpm --filter @next/container test             # vitest run (jsdom)
pnpm --filter @next/container exec vitest run src/features/reviews   # one folder
pnpm --filter @next/container build            # type check + production build
```

## Layout and dependency direction

```text
App / Router -> pages/ -> features/<name>/ -> shared/
                     \-> components/ (ui, layout) / stores/ / helpers/ / utils/ / config/
```

- `pages/<Name>/`: route entry points. Compose features; no business logic of their own.
- `features/<name>/`: one business capability (`auth`, `reviews`, `calengrade`, `help`, `whatsapp`, `history`).
  A feature never imports another feature. Promote shared business concepts to `shared/`.
- `shared/`: framework-independent business code (no Vue, services, stores, features, or pages).
- `components/ui/`: presentational only. Typed props and events; no API calls, no stores.
- `components/layout/`: app shell and navigation.
- Inside a feature use relative imports; across layers use `@/`.

## Conventions

- `<script setup lang="ts">` single-file components. One component per folder:
  `Name/Name.vue`, `Name/Name.test.ts`, `Name/index.ts` (`export { default as Name } from './Name.vue'`).
- Server state goes through Vue Query: `useQuery({ queryKey: ['resource', id], queryFn: () => Service.method(id) })`.
  Put reactive values (refs/computed) in `queryKey`. Invalidate with the same key after mutations.
- API calls live in `packages/services/src/<domain>.ts`, never inline `axios` in components.
  New endpoint: add the method and its types there, then consume it with Vue Query.
- Pinia only for session/global state (`stores/auth.ts`). Feature state stays in feature composables.
- Forms: vee-validate with a Zod schema in `features/<name>/validation/`.
- User-facing text is Portuguese (pt-BR). Code identifiers are English.
- `auto-imports.d.ts` and `components.d.ts` are generated; never edit them.
- `.env`, `.env.staging`, `.env.production` are committed and hold only public `VITE_*` values that ship in the
  bundle. Never put a secret in them.

## Tests

- Vitest + jsdom + Testing Library. Render with `render` from `@/test-utils` (it installs Vuetify,
  Element Plus, and Vue Query with `retry: false`). Pass extra plugins (Pinia, router) through `global.plugins`.
- Routes are declared in `src/router/index.ts`; auth guards live in `src/router/auth/`.
- HTTP is mocked with MSW: default handlers in `src/mocks/handlers.ts`, fixtures in `src/mocks/<domain>.ts`,
  per-test overrides with `server.use(http.get(...))`.
- Query by role or visible text (`screen.findByText('...')`), assert behavior, not implementation details.
- Tests sit next to the code they test. Every new component or composable gets one.

## Moving code

Moving code between layers must preserve route paths, route metadata, component contracts, and
user-visible behavior. Do moves in a separate commit or PR from behavior changes.
