# UFABC next - Extension

### Como rodar o projeto?

Node version: >=22

1. `pnpm install`
3. `pnpm dev`

Um navegador irá se abrir com a extensão já carregada, basta acessar a URL do [Sigaa](https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf) ou do site de
[Snapshot](https://ufabc-matricula-snapshot.vercel.app/) de matrículas.

Agora, a extensão já estará rodando localmente e você pode desenvolver, a extensão possui hot-reload.

Para ter a melhor experiência de desenvolvimento, é necessário rodar as outras aplicações do ecossistema next:

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
