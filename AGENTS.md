# AGENTS.md

Guia de arquitetura e convenções do monorepo **ufabc-next** para agentes de código.

## Visão geral

Monorepo pnpm + Turborepo, TypeScript em todo lugar (`type: module`, ESM). Node `^24`,
pnpm `10.x` como package manager, `turbo` orquestra `build`/`dev`/`lint`/`test`/`tsc`.

```
apps/
  core/         Backend Fastify (API + jobs + workers)
  container/    Frontend principal (Vue 3 + Vuetify) — "o app"
  extension/    Extensão de browser (WXT + Vue) para sig/matrícula/moodle da UFABC
  static/       Site estático (landing, termos, privacidade) — HTML puro
packages/
  connectors/   Clientes HTTP para serviços externos (ufabc-parser, moodle, sigaa, s3, ai-proxy...)
  db/           Modelos Mongoose "novos" (v2) + client de conexão + queries
  logger/       Logger compartilhado (pino no server, versão browser, sanitização de logs)
  queues/       Sistema de filas/jobs compartilhado (BullMQ) — builder + manager genéricos
  services/     Clientes de API do frontend (consumidos por container/extension)
  testing/      Utilitários de teste (testcontainers, factories, mocks, nock)
  utils/        Funções puras compartilhadas (coeficientes, identificadores, datas)
tools/
  tsconfig/     tsconfigs base publicados como pacote `@next/config` (base/apps/libs/vue)
  docker-infra/ Scripts de infra para docker-compose (healthcheck etc.)
scripts/        Scripts auxiliares (docker init, etc.)
```

Cada `apps/*` e `packages/*` é um workspace (`pnpm-workspace.yaml`: `apps/*`, `packages/*`, `tools/*`).
Dependências internas usam `workspace:*`; versões de terceiros compartilhadas vêm do
`catalog:` do pnpm (definido em `pnpm-workspace.yaml`) — ao adicionar uma dependência já
presente no catalog, referencie `"catalog:"` em vez de fixar uma versão nova.

## Convenção de nomes de pacotes

Todo pacote interno é `@next/<nome>` (ex.: `@next/core`, `@next/db`, `@next/logger`).
Pacotes de biblioteca (`packages/*`) expõem múltiplos entrypoints via `exports` no
`package.json` (ex.: `@next/logger/server`, `@next/testing/containers`,
`@next/connectors/moodle`) em vez de um único `index.ts` — ao consumir, importe do
subpath específico, não do pacote raiz.

## `apps/core` — Backend Fastify

Fastify 5 com plugins via `@fastify/autoload`. `src/app.ts` é o ponto de montagem;
`src/server.ts` só cria a instância `fastify()` e chama `start()`.

### Camadas de plugin (ordem de registro em `app.ts`)

1. `plugins/external/*` — wrappers finos em volta de plugins de terceiros do Fastify
   (`cors.ts`, `jwt.ts`, `mongoose.ts`, `swagger.ts`, `env.ts`/`config.ts`...). Um
   arquivo por plugin de terceiro.
2. `plugins/custom/*` — plugins próprios não ligados a uma lib externa específica
   (`authorization.ts`, `memory-cache.ts`, `tracing.ts`, `token-generator.ts`).
3. `plugins/v2/*` — infraestrutura das rotas novas (`aws.ts`, `queue.ts`, `redis.ts`,
   `test-utils.ts`) e `setup.ts`, que registra os *controllers* v2 sob o prefixo `/v2`.
4. Rotas "legadas" (`routes/`) via autoload com `autoHooks: true` — ver abaixo.

Há dois sistemas de rota coexistindo, diferenciados pelo prefixo de URL:

- **Rotas legadas** (sem `/v2`): pasta `src/routes/<recurso>/{index.ts,service.ts}`,
  carregadas automaticamente pelo `@fastify/autoload` a partir de `src/routes`. Schemas
  ficam em `src/schemas/<recurso>.ts` (ou `src/schemas/entities/<recurso>.ts` para as
  entidades de domínio) e usam `fastify-zod-openapi` (`FastifyPluginAsyncZodOpenApi`).
  `src/routes/autohooks.ts` é o hook global de autenticação: mantém listas
  `PUBLIC_ROUTES`/`EXTENSION_ROUTES` para decidir se a rota exige JWT, sessão de
  extensão ou é pública — **rotas legadas novas precisam ser adicionadas a uma dessas
  listas se não exigirem JWT padrão**.
- **Rotas v2**: "controllers" em `src/controllers/*-controller.ts`, registrados
  manualmente na lista `routesV2` em `app.ts` e montados sob `/v2` por
  `plugins/v2/setup.ts`. Usam `fastify-type-provider-zod` (schemas Zod puros, tipo
  `FastifyPluginAsyncZod`). `plugins/v2/setup.ts` implementa compiladores híbridos que
  escolhem `fastify-type-provider-zod` vs `fastify-zod-openapi` conforme a URL começa
  com `/v2` — não misture os dois estilos de schema dentro do mesmo arquivo de rota.

Ao adicionar um recurso novo, prefira o padrão v2 (controller + Zod puro) — é o padrão
para o qual o backend está migrando; o padrão legado existe por compatibilidade com
rotas antigas.

### Outras pastas de `apps/core/src`

- `models/` — modelos Mongoose "legados" (schema Mongoose + `model()`), um arquivo por
  entidade (`Student.ts`, `Subject.ts`, `Enrollment.ts`...), PascalCase.
- `connectors/` — clientes para serviços externos específicos do core (duplica em parte
  `packages/connectors`; veja se o cliente já existe no pacote compartilhado antes de
  criar um novo aqui).
- `hooks/` — hooks reutilizáveis do Fastify (`jwtVerify`, `isStudent`, autenticação de
  sessão de moodle/sigaa/matrícula, permissões), decorados na instância/request.
- `jobs/` — jobs de longa duração/flows do "novo" sistema de filas (`registry.ts`
  centraliza o registro), distintos de `queue/jobs/` (sistema antigo, ver abaixo).
- `queue/` — sistema de filas legado, próprio do core: `Job.ts`/`Worker.ts` (classes
  base), `definitions.ts` (mapa `QUEUE_JOBS`/`JOBS` com config de cada fila BullMQ),
  `board.ts` (Bull Board), `jobs/*.job.ts` (handlers, sufixo `.job.ts`). O sistema novo
  (`@next/queues`, usado via `app.manager`/`app.job`) é genérico e vive em
  `packages/queues`; `apps/core/src/jobs` é onde os jobs concretos desse sistema novo
  moram.
- `errors/` — classes de erro de domínio (ex. `ufabc-parser.ts`).
- `lib/` — integrações "grandes" que não são simples conectores HTTP (`aws.service.ts`,
  `notion.service.ts`).
- `services/` — lógica de negócio compartilhada entre rotas quando não cabe no
  `service.ts` de uma única rota.

### Testes do core

`tests/integration/**/*.spec.ts`, usando `@next/testing/containers` (`startTestStack`)
para subir Mongo/Redis/LocalStack via testcontainers e `buildApp` real. Rotas ignoradas
pelo autoload de produção via `ignorePattern` em `app.ts`
(`/^.*(?:test|spec|service|sync).(ts|js)$/`) — arquivos `service.ts` dentro de
`routes/*` não viram rota por causa desse padrão.

## `apps/container` — Frontend principal (Vue)

Vue 3 + Vuetify + Pinia + Vue Router + TanStack Query, build com Vite.

- `src/views/<Feature>/<Feature>View.vue` — uma pasta por página/feature, componente
  principal sufixado `View.vue`. Roteado em `src/router/index.ts` (import dinâmico por
  view; meta define `requiresAuth`/`requiresConfirmed`/`guestOnly`/`unconfirmedOnly`/
  `layout`).
- `src/components/<ComponentName>/` — componentes reutilizáveis, uma pasta por
  componente (PascalCase); componentes triviais podem ser um `.vue` solto direto em
  `components/`.
- `src/stores/` — Pinia stores (`defineStore`), `persist: true` quando o estado deve
  sobreviver a reload (ex. `auth.ts`).
- `src/router/auth/` — lógica de guard de autenticação isolada do `router/index.ts`
  (redirect paths, helpers de validação).
- `src/utils/` — funções puras + `composables/` (Vue composables) dentro de utils.
- `src/mocks/` — handlers MSW para desenvolvimento/teste (`server.ts` + um arquivo por
  domínio mockado).
- Alias `@/*` → `src/*` (configurado em `tsconfig.json` e `vite.config.ts`).
- Depende de `@next/services` para chamadas de API e `@next/logger` para logging no
  browser — não crie chamadas HTTP soltas fora de `@next/services`.
- Testes co-localizados (`*.test.ts` ao lado do arquivo, ex. `stores/auth.test.ts`).

## `apps/extension` — Extensão de browser (WXT)

Framework WXT + Vue. `src/entrypoints/` é a estrutura que o WXT espera:
`background.ts` (service worker), `popup/` (UI da extensão), e um diretório
`*.content/` por content script injetado num domínio da UFABC (`sig.content`,
`matricula.content`, `moodle.content`) — nome do diretório reflete o site alvo.

- `src/composables/` — composables Vue específicos da extensão.
- `src/services/` — clientes de API (`next.ts` para o backend, `ufabc-parser.ts`).
- `src/scripts/` — scripts auxiliares injetados/rodados fora do ciclo de vida padrão
  de componente Vue (ex. `scripts/sig`).
- Depende de `@next/connectors` (clientes compartilhados) e `@next/logger`.
- Mensageria entre contexts (background/content/popup) centralizada em
  `src/messaging.ts` via `@webext-core/messaging`.

## `apps/static`

Site estático puro (sem build step de framework): `index.html` +
`assets/{css,js,fonts,icons,images}`. Não faz parte do grafo TypeScript/Turborepo do
resto do monorepo.

## Pacotes compartilhados (`packages/*`)

- **`@next/db`** — modelos Mongoose "v2" (usados pelas rotas v2 do core), plus
  `client.ts` (plugin Fastify de conexão, decora `app.db`/`app.rawMongoose`) e
  `queries/`. Menor e mais novo que `apps/core/src/models` — modelos v2 vivem aqui,
  modelos legados continuam em `apps/core/src/models`.
- **`@next/queues`** — motor de filas genérico (`JobManager` em `manager.ts`,
  `builder.ts` define jobs tipados com schema Zod de input/output). É consumido pelo
  core via decorators `app.manager`/`app.job`/`app.worker`. Ao adicionar um job novo do
  sistema v2, o handler concreto vai em `apps/core/src/jobs`, não neste pacote — este
  pacote só tem a engine.
- **`@next/connectors`** — um arquivo por serviço externo (`moodle.ts`, `sigaa.ts`,
  `ufabc-parser.ts`, `s3-connector.ts`...), schemas de validação em `src/schemas/`,
  erros de domínio em `src/errors/`. Base comum: `base-requester.ts` (HTTP) e
  `base-aws-connector.ts` (AWS).
- **`@next/logger`** — `server.ts` (pino), `browser.ts` (versão browser),
  `sanitize.ts` (remove segredos/dados sensíveis antes de logar — usar sempre que for
  logar `request.query`/body/headers).
- **`@next/services`** — um arquivo por domínio (`auth.ts`, `comments.ts`,
  `enrollments.ts`...), tudo reexportado por `src/index.ts`. É a camada de API
  consumida pelo `container` (e parcialmente `extension`); adicionar endpoint novo aqui
  em vez de chamar `fetch`/`axios` direto de um componente.
- **`@next/utils`** — funções puras sem dependências externas relevantes, arquivo +
  `.spec.ts` lado a lado em `lib/` (ex. `calculateCoefficients.ts` /
  `calculateCoefficients.spec.ts`).
- **`@next/testing`** — `containers.ts` (`startTestStack`, sobe testcontainers),
  `factories.ts` (fixtures de dados), `mocks.ts`, `methods.ts`. Usado só como
  `devDependency` pelos outros pacotes/apps.

## TypeScript

tsconfigs base centralizados em `tools/tsconfig` e publicados como `@next/config`:
`base.json` (Node/lib), `apps.json` (estende `fastify-tsconfig`, para o core),
`libs.json` (pacotes de biblioteca, `noUncheckedIndexedAccess: true`), `vue.json`
(frontend). Cada app/pacote estende o que for aplicável em vez de duplicar
`compilerOptions`.

Alias `@/*` → `./src/*` é usado em `apps/core`, `apps/container` e `apps/extension`
(cada um resolve para o próprio `src`, não é um alias compartilhado entre apps).

## Lint/format

`oxlint` (não ESLint) + `oxfmt` (não Prettier), configurados em `oxlint.config.ts` na
raiz estendendo `ultracite/oxlint/core`, com overrides por diretório (env
browser/node/webextensions por app). Regras notáveis fixadas no config raiz:
`func-style: declaration` (funções nomeadas, não `const fn = () =>` no top level),
`typescript/consistent-type-definitions: type` (usar `type`, não `interface`).
`pnpm lint` / `pnpm lint:fix` na raiz rodam via Turborepo em todos os workspaces.

## Testes

`vitest` em todo lugar. Backend usa testes de integração reais contra
Mongo/Redis/LocalStack via `testcontainers` (não mocka o banco) — ver
`@next/testing/containers`. Frontend (`container`/`extension`) usa MSW para mockar
HTTP e testa stores/utils isoladamente; testes ficam co-localizados com o código
(`arquivo.test.ts` ao lado de `arquivo.ts`), diferente do core que usa `tests/` à
parte.

## CI/Deploy

`.github/workflows/ci.yml` roda `pnpm turbo run build lint tsc`, com filtro de
afetados (`--filter=...[origin/<base>]`) em PRs e build completo em push para `main`.
Deploy do backend (`deploy-core.yml`) e do frontend (`deploy-frontend.yml`) são
workflows separados. Local: `docker-compose.yml` sobe `next-db` (Mongo), `next-redis`,
`localstack` e o `core` para desenvolvimento contra infra real.
