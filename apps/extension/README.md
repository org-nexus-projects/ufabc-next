# Browser extension

`apps/extension` é a extensão WXT que integra funcionalidades do UFABC Next a sistemas da UFABC.

## Desenvolvimento local

Node.js `^24` e pnpm `^10` são requisitos do workspace.

Na raiz do repositório:

```sh
pnpm --filter @next/extension dev
pnpm --filter @next/extension dev:firefox
```

O WXT abre um navegador com a extensão carregada e mantém hot reload durante o desenvolvimento.

## Publicação

Use os scripts de build e zip declarados em `apps/extension/package.json` para gerar os artefatos. A publicação em loja ou release é uma operação externa: confirme o destino e a aprovação antes de iniciá-la.

## Integrações

A extensão interage com páginas de matrícula, Moodle e SIGAA. Essas páginas, suas sessões e os dados de estudantes são fronteiras de integração sensíveis.

Leia [AGENTS.md](AGENTS.md) antes de editar entrypoints, mensagens ou serviços da extensão.
