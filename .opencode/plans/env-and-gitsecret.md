# Plan: .env standardization + gitsecret migration

## Changes

### 1. `apps/core/package.json` (line 12)
```diff
- "dev:local": "tsx watch --env-file=.env.dev src/server.ts"
+ "dev:local": "tsx watch --env-file=.env src/server.ts"
```

### 2. `apps/core/src/plugins/external/config.ts` (line 63)
```diff
-     path: '.env.dev',
+     path: '.env',
```

### 3. `docker-compose.yml` (line 69)
```diff
-       - ./apps/core/.env.dev
+       - ./apps/core/.env
```

### 4. `.gitignore` (remove `.env.dev` line 20)
```diff
 .env
 .env.local
- .env.dev
 .env.prod
```

### 5. `Dockerfile` (lines 83-84)
```diff
- COPY --chown=core:backend --from=deployer /workspace/apps/backend/.env.prod.secret .
- COPY --chown=core:backend --from=deployer /workspace/apps/backend/.gitsecret  ./.gitsecret
+ COPY --chown=core:backend --from=deployer /workspace/apps/core/.env.prod.secret .
+ COPY --chown=core:backend --from=deployer /workspace/apps/core/.gitsecret  ./.gitsecret
```

### 6. Move gitsecret files (bash)
```bash
mv apps/backend/.env.prod.secret apps/core/.env.prod.secret
mv apps/backend/.gitsecret apps/core/.gitsecret
```

### 7. Delete stale `apps/backend/` (bash)
```bash
rm -rf apps/backend
```

## Post-migration
- Devs create `apps/core/.env` by copying `apps/core/.env.example`
- `.env` is already gitignored at root (line 18)
- `!*.secret` already un-ignores `.env.prod.secret` at any depth
- No `pnpm-workspace.yaml` or turbo changes needed
