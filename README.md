<div align="center">

  <h1>UFABC Next</h1>
  
  <p>
    <strong>O portal para estudantes da UFABC consultarem avaliações de professores e disciplinas, planejarem suas grades e acompanharem seu desempenho acadêmico.</strong>
  </p>
  
  <p>
    <a href="https://github.com/ufabc-next/ufabc-next-web/actions"><img src="https://img.shields.io/github/actions/workflow/status/ufabc-next/ufabc-next-web/integration-deploy.yml?branch=main" alt="Build Status"/></a>
    <a href="https://github.com/ufabc-next/ufabc-next-web/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ufabc-next/ufabc-next-web" alt="License: GNU AGPLv3"/></a>
    <img src="https://img.shields.io/badge/Node-^20.19.6-success?logo=nodedotjs" alt="Node Version"/>
    <img src="https://img.shields.io/badge/pnpm-^10.28.0-yellow?logo=pnpm" alt="pnpm"/>
    <img src="https://img.shields.io/badge/Vue-3.x-42b883?logo=vuedotjs" alt="Vue 3"/>
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript"/>
  </p>
</div>

### Este repositório reúne as aplicações e os pacotes que o sustenta.

## Workspace

| Área             | Responsabilidade                                                       |
| ---------------- | ---------------------------------------------------------------------- |
| `apps/web`       | Frontend principal, que corresponde ao site do next.                   |
| `apps/core`      | API em Fastify que corresponde ao backend do next, é o coração de tudo.|
| `apps/extension` | Extensão de navegador                                                  |
| `apps/static`    | Landing page do next                                                   |
| `packages/*`     | Bibliotecas compartilhadas de API, banco, filas, testes e utilitários. |

## Desenvolvimento local

O workspace requer Node.js `^24` e pnpm `^10`. A API também usa Docker Compose para seus serviços locais.

```sh
pnpm install
```

Copie o arquivo de configuração global e preencha as integrações necessárias:

```sh
cp .env.example .env
```

Todas as aplicações leem esse único `.env` na raiz do workspace. No portal,
`WEB_LOCAL_API_BASE_URL` e `WEB_PRODUCTION_API_BASE_URL` definem a API de cada
alvo; os respectivos tokens do Mixpanel são opcionais. Esses valores são
expostos no navegador, logo não inclua segredos neles. O modo da aplicação, o
base path e a URL pública do parser são derivados do alvo selecionado.

Para desenvolvimento, `pnpm dev` abre uma seleção interativa. Marque as
aplicações com espaço e confirme com Enter; para `web` e `extension`, escolha
se a aplicação local apontará para o backend `dev` ou `prod`. A `core` é sempre
iniciada localmente. Para manter o comando anterior que inicia todas as
aplicações, use `pnpm dev:all`.

## Frontend com Backend de Produção

Executa o portal localmente consumindo a API de produção (login via Google OAuth).

Verifique no .env se WEB_PRODUCTION_API_BASE_URL aponta para a API de produção.

Inicie o portal:

pnpm dev --web prod


Acesse http://localhost:3000/app/login e clique em Entrar com Google.

## Frontend com Backend Local

Executa o portal e a API localmente (login via e-mail direto, sem OAuth).

Verifique no .env se WEB_LOCAL_API_BASE_URL aponta para a API local (padrão: http://localhost:5000).

Inicie os serviços:

pnpm dev --web dev --core --jobs off


Aguarde os serviços iniciarem e acesse http://localhost:3000/login.

Insira um e-mail autorizado (ex: next.dev@aluno.ufabc.edu.br) e clique em Entrar no ambiente DEV.

Nota de Autenticação: Para liberar outros e-mails locais, adicione-os na variável BACKOFFICE_EMAILS do .env (separados por vírgula). O e-mail também deve existir na coleção users do seu MongoDB local.

Inicie apenas a aplicação necessária:

```sh
pnpm --filter @next/web dev
pnpm --filter @next/core dev
pnpm --filter @next/extension dev
```

`apps/static` contém arquivos estáticos e não possui processo de desenvolvimento próprio no workspace.

Os manifests `package.json` são a fonte de verdade para os demais comandos e pré-requisitos de cada área.

## Validação

Os comandos de workspace executam as tarefas declaradas pelos pacotes:

```sh
pnpm lint
pnpm test
pnpm tsc
```

Rode apenas a validação proporcional à área e à mudança realizada.

## Contribuição

Leia [AGENTS.md](AGENTS.md) antes de alterar o repositório. Ele reúne as regras de domínio, segurança de dados e publicação para pessoas e agentes de IA.

Para propor trabalho público, use as convenções em [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md). Não inclua conversas privadas, dados de estudantes, sessões externas ou backups em issues, commits, pull requests ou logs.

## Trabalho com IA

O repositório oferece instruções para Codex, Claude Code, GitHub Copilot e Gemini CLI. A fonte de verdade é [AGENTS.md](AGENTS.md); os adaptadores apenas permitem que cada ferramenta a encontre.

Antes de uma mudança de domínio, leia [CONTEXT.md](CONTEXT.md).
