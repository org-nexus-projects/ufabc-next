import { fileURLToPath } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));
const webEnvKeys = [
  'APP_ENV',
  'APP_BASE_URL',
  'API_BASE_URL',
  'PARSER_API_BASE_URL',
  'MIXPANEL_TOKEN',
] as const;

const profileForTarget = (target: string) => {
  if (target === 'dev') {
    return 'local';
  }

  if (target === 'prod') {
    return 'production';
  }

  throw new Error(
    `Unsupported web target: ${target}. Use dev or prod.`,
  );
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, workspaceRoot, '');
  const target = process.env.NEXT_WEB_TARGET ?? (mode === 'production' ? 'prod' : 'dev');
  const profile = profileForTarget(target);
  const selectedEnv = Object.fromEntries(
    webEnvKeys.map((key) => [
      `VITE_${key}`,
      env[`WEB_${profile.toUpperCase()}_${key}`] ?? '',
    ]),
  );

  Object.assign(process.env, selectedEnv);

  return {
    base: selectedEnv.VITE_APP_BASE_URL || '/',
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    envDir: workspaceRoot,
    plugins: [vue()],
    preview: {
      host: true,
      port: 3000,
      strictPort: true,
    },
    resolve: {
      alias: [
        {
          find: '@',
          replacement: fileURLToPath(new URL('src', import.meta.url)),
        },
      ],
      dedupe: ['@vue/shared'],
    },
    server: {
      host: true,
      port: 3000,
      strictPort: true,
    },
  };
});
