import { fileURLToPath } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));
const webEnvKeys = ['API_BASE_URL', 'MIXPANEL_TOKEN'] as const;
const parserApiBaseUrl = 'https://ufabc-parser.com/v2';

const webTargetConfig = {
  dev: {
    appBaseUrl: '/',
    appEnv: 'local',
  },
  prod: {
    appBaseUrl: '/app',
    appEnv: 'production',
  },
} as const;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, workspaceRoot, '');
  const target =
    process.env.NEXT_WEB_TARGET ?? (mode === 'production' ? 'prod' : 'dev');

  if (!(target in webTargetConfig)) {
    throw new Error(`Unsupported web target: ${target}. Use dev or prod.`);
  }

  const targetConfig = webTargetConfig[target as keyof typeof webTargetConfig];
  const selectedProfileEnv = Object.fromEntries(
    webEnvKeys.map((key) => [
      `VITE_${key}`,
      env[`WEB_${targetConfig.appEnv.toUpperCase()}_${key}`] ?? '',
    ])
  );
  const selectedEnv = {
    ...selectedProfileEnv,
    VITE_APP_BASE_URL: targetConfig.appBaseUrl,
    VITE_APP_ENV: targetConfig.appEnv,
    VITE_PARSER_API_BASE_URL: parserApiBaseUrl,
  };

  Object.assign(process.env, selectedEnv);

  return {
    base: selectedEnv.VITE_APP_BASE_URL,
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
