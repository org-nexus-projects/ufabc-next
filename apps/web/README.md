# Web portal

`apps/web` é o portal Vue e Vite do UFABC Next.

## Desenvolvimento local

Node.js `^24` e pnpm `^10` são requisitos do workspace.

Na raiz do repositório:

```sh
pnpm --filter @next/web dev
```

Use os scripts declarados em `apps/web/package.json` para build, testes e verificação de tipos.

## Limite de API

O portal consome a API por `@next/services`. Ao mudar uma requisição, resposta ou tipo compartilhado, atualize o módulo em `packages/services` e os consumidores afetados.

## Fluxos e domínio

Um fluxo de interface normalmente atravessa rota, view, estado ou query e serviço de API. Localize esse caminho antes de editar.

Leia [AGENTS.md](AGENTS.md) antes de mudar o portal e [CONTEXT.md](../../CONTEXT.md) antes de mudar comportamento de domínio.
