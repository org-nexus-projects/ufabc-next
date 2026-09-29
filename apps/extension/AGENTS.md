# `@next/extension` — Browser extension

WXT extension (Chrome and Firefox, Vue 3 + Element Plus + Tailwind) that injects UFABC Next features
into university systems and syncs student data to the API. Read the root [`AGENTS.md`](../../AGENTS.md) first.

## Commands

```bash
pnpm --filter @next/extension dev            # Chrome with hot reload (dev server on :3002)
pnpm --filter @next/extension dev:firefox
pnpm --filter @next/extension compile        # vue-tsgo type check
pnpm --filter @next/extension lint           # oxlint ./src (exit code is always 0; read the output)
pnpm --filter @next/extension build          # production build into .output/
pnpm --filter @next/extension zip            # store package
```

`compile` already fails on `main` with about 10 type errors (`wxt.config.ts` `webExt`, `KicksModal.vue`,
`SubjectReview.vue`, `TeacherReview.vue`, `matricula.content`, `background.ts`). Compare the error list before and
after your change (`pnpm --filter @next/extension compile 2>&1 | grep 'error TS'`): you must not add new ones.

There is no automated test suite here. Verify behavior manually against the target page
(`dev` opens a browser with the extension loaded) and describe the manual test in the PR.

## Layout

```text
src/
  entrypoints/
    background.ts              service worker: cookie/token access, answers messages
    sig.content/               content script on https://sig.ufabc.edu.br/* (SIGAA: history sync)
    matricula.content/         content script + Vue UI on matricula.ufabc.edu.br (enrollment helper)
    moodle.content/            content script on moodle.ufabc.edu.br/my/courses.php (course archives)
    popup/                     browser-action popup (Vue)
  messaging.ts                 typed message protocol between content scripts and background
  services/next.ts             UFABC Next API client
  services/ufabc-parser.ts     wraps @next/connectors/ufabc-parser
  components/ composables/ utils/ scripts/
```

## Conventions

- Content scripts cannot read cookies. Ask the background through `sendMessage` from `@/messaging`; add new
  messages to `ProtocolMap` first so both sides stay typed.
- Host permissions are limited to `sig`, `matricula`, and `moodle` on `ufabc.edu.br` (`wxt.config.ts`).
  Adding a host or permission changes the store review; ask first.
- The DOM of SIGAA/Matrícula/Moodle is not ours and changes without notice. Guard every selector and parse step,
  fail soft (log + toast), and never break the host page.
- Never log or send cookies, session tokens, or full scraped pages. Log through `src/utils/logger.ts`.
- `import.meta.env.VITE_*` values are baked into the bundle. `.env*` files here are local and git-ignored.
- `auto-imports.d.ts`, `components.d.ts`, `.wxt/`, and `.output/` are generated.
- Formatting in this app still mixes tabs and double quotes in older files; keep the style of the file you edit.

## Releasing

User-visible changes need a changeset: `cd apps/extension && pnpm changeset`, pick `@next/extension` and a bump.
`.github/workflows/release-extension.yml` validates it and, on `main`, bumps the version, tags
`extension-vX.Y.Z`, creates the GitHub release, and submits to the Chrome Web Store.
