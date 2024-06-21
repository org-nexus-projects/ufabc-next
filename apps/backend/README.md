# UFABC Next Backend

Repositório que contém todo o código que se refere ao backend que mantém o site de pé!

## Ferramentas necessárias para rodar o projeto

- Runtime: [Nodejs](https://nodejs.org/en), v22
- Package Manager: [pnpm](https://pnpm.io/) v8
- Conteinerização: [Docker](https://www.docker.com/) v24 e [Docker Compose](https://docs.docker.com/engine/reference/commandline/compose/) v2
- Sistema Operacional: Pode usar o que preferir, garanto suporte a MacOS, Linux e WSL. Caso enfrente algum problema com Windows, clique [aqui](https://github.com/ufabc-next/ufabc-next-backend/issues/new) e descreva seu problema, para que possamos te auxiliar :)

## Rodando o projeto

Com as ferramentas necessárias instaladas, clone o repositório

```sh
# Clone o repositório
git clone https://github.com/ufabc-next/ufabc-next-backend.git

# Vá para o diretório do repo
cd ufabc-next-backend

# instale as dependências na raiz
pnpm i

# Rode o comando `build` para que o código tenha acesso as libs internas
pnpm build

# Suba o container docker
docker compose up -d

# Realize a copia das variaveis de ambiente para o arquivo .env
cp -r apps/core/.env.example apps/core/.env

# De `start` no projeto
pnpm dev

# Simule o projeto com dados
pnpm populate reset
```

## O que temos no repo?

O projeto tem os seguintes packages e apps, cada um desenvolvido com 100% Typescript

### Apps
- `core`: Uma api [Fastify](https://fastify.dev/), que contém todas as rotas do backend.

### Packages

- `common`: funções utilitárias que podem ser consumidas por um ou mais packages, logger do app é configurado aqui
- `tsconfig`: `tsconfig.json`s utilizados ao longo do monorepo

### Utilities

Utilitários que o monorepo possui ja configurado
- [Turborepo](https://turborepo.org/) para gerenciamento do monorepo
- [TypeScript](https://www.typescriptlang.org/) para tipagem estática
- [Biome](https://eslint.org/) Lint & format
- [Node.js](https://nodejs.org/api/test.html) para realização de testes unitários
- [Renovate](https://docs.renovatebot.com/) para manter a saúde das dependências do projeto
