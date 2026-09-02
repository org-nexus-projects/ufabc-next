# ADR 0001: CLI de inicialização e alvos de backend locais

## Contexto

O workspace possui três aplicações que podem ser iniciadas durante o
desenvolvimento: `web`, `core` e `extension`. `web` e `extension` podem ser
executadas localmente apontando para uma API local ou para a API de produção.
`core` representa a API local e não possui uma opção de produção na CLI.

## Decisão

`pnpm dev` abre uma CLI interativa nativa do Node.js. A pessoa desenvolvedora
seleciona uma ou mais aplicações com as setas, espaço e Enter. Para cada
seleção de `web` ou `extension`, escolhe o alvo `dev` ou `prod`.

- `dev` aponta a aplicação local para a API local.
- `prod` aponta a aplicação local para a API de produção.
- `core` é iniciado somente no modo local.

A CLI lê somente a URL pública do perfil selecionado no `.env` global para
injetá-la na extensão. O portal recebe o alvo em `NEXT_WEB_TARGET`. Nenhum
segredo do `.env` é injetado no navegador ou na extensão.

Os processos são iniciados diretamente pelo Node.js, com entrada e saída
herdadas. A CLI encaminha `Ctrl+C` para os processos filhos, sem adicionar uma
biblioteca de supervisão de processos. O antigo comando que inicia todas as
aplicações pelo Turbo continua disponível como `pnpm dev:all`.

## Consequências

- Os arquivos de ambiente específicos do portal e seus scripts de seleção por
  modo deixam de ser necessários.
- A extensão deixa de ter a URL da API de produção fixada no código.
- A execução sem terminal interativo deve usar os comandos específicos de cada
  aplicação, e não `pnpm dev`.
