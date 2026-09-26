# Frontend architecture

The container is a Vue 3 single-page application organized around route entry
points, business features, and shared building blocks.

## Source layout

- `pages/`: route-level entry points. Pages compose features and shared UI.
- `features/`: business capabilities. Components, composables, validation, types,
  and utilities that belong to one capability stay together.
- `shared/`: business concepts used by more than one feature. Shared modules are
  framework-independent and must not import from features or pages.
- `components/ui/`: reusable presentational components. They must not call APIs or
  import stores, features, or pages.
- `components/layout/`: application-shell and navigation components.
- `config/`: framework and third-party library configuration.
- `stores/`: global or session state managed by Pinia.
- `helpers/`: cross-cutting application helpers such as event tracking.
- `utils/`: generic, pure utilities and infrastructure adapters.

Tests stay next to the source they exercise.

## Dependency direction

```text
App / Router -> Pages -> Features -> Shared
                     \-> Components / Stores / Helpers / Utils / Config
```

- Pages may compose multiple features.
- A feature must not import another feature. Promote a shared business concept
  to `shared/` instead.
- Shared modules must not depend on Vue, services, stores, features, or pages.
- Shared UI must remain presentational and expose typed props and events.
- Code inside the same feature uses relative imports. Imports across layers use
  the `@/` alias.

## Current feature boundaries

- `auth`: session-facing UI, auth-derived composables, and form validation.
- `reviews`: subject and teacher reviews, comments, and pending reviews.
- `calengrade`: schedule parsing, preview, summary, and calendar generation.
- `help`: help form validation and help-specific behavior.
- `whatsapp`: WhatsApp group discovery and presentation.
- `history`: academic-history presentation.

Academic quarter dates and season selection live in
`shared/academic-calendar`, because both Calengrade and WhatsApp consume that
business concept.

## Component map

- Pages own route orchestration and compose feature components.
- Feature components own feature-specific UI and behavior.
- Layout components own application navigation and shell presentation.
- UI components render reusable visual patterns through typed props and events.
- Stateful or store-dependent composables remain with the feature that owns the
  state.

Moving code between these layers must preserve route paths, route metadata,
component contracts, and user-visible behavior.
