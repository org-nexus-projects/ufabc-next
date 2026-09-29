# Core API

`apps/core` é a API Fastify do UFABC Next e concentra integrações, persistência, filas e processamento de dados acadêmicos.

## Desenvolvimento local

- Node.js `^24` e pnpm `^10` são requisitos do workspace.
- Docker Compose fornece MongoDB, Redis e LocalStack para a API.
- Variáveis de ambiente locais são necessárias para executar a aplicação.

Na raiz do repositório:

```sh
pnpm --filter @next/core dev
```

Esse fluxo inicia a API com a infraestrutura Docker local. Para executar o código fonte localmente, use:

```sh
pnpm --filter @next/core dev:local
```

Consulte `apps/core/package.json` para os scripts de build, testes, manutenção de banco e os requisitos de configuração.

## Mudanças de contrato

Contratos da API atingem schemas, handlers, persistência e o cliente em `packages/services`. Leia [AGENTS.md](AGENTS.md) antes de editar e mantenha esses pontos alinhados.
