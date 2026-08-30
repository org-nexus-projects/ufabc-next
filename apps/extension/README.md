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

Backend: https://github.com/ufabc-next/ufabc-next-backend

### Como publicar?

O deploy é automatizado via GitHub Actions (`.github/workflows/release-extension.yml`).

1. **Criar um changeset** — dentro de `apps/extension/`:
   ```
   cd apps/extension && pnpm changeset
   ```
   Selecione `@next/extension`, escolha o bump (`major`/`minor`/`patch`), escreva o changelog. Commit o arquivo gerado em `.changeset/`.

2. **Validar com dry-run** — em https://github.com/org-nexus-projects/ufabc-next/actions/workflows/release-extension.yml, clique "Run workflow" e marque `dryRun`. Isso vai buildar, zipar, rodar `wxt submit --dry-run` e subir o artifact — sem publicar de verdade.

3. **Publicar** — repita o dispatch **sem** marcar `dryRun`. O pipeline vai:
   - Bump da versão + CHANGELOG
   - Commit + tag (`extension-vX.Y.Z`) + push
   - Criar uma GitHub Release com o zip
   - Enviar para a Chrome Web Store (`wxt submit`)

   Após o submit, a nova versão aparece como **rascunho** no CWS Dashboard — pode ser que precise clicar em "Publish" manualmente, dependendo das permissões da conta.
