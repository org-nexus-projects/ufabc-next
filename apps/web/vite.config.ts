import { fileURLToPath } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_APP_BASE_URL || '/',
    server: {
      port: 3000,
      host: true,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    preview: {
      port: 3000,
      host: true,
      strictPort: true,
    },
    plugins: [vue()],
    resolve: {
      dedupe: ['@vue/shared'],
      alias: [
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
      ],
    },
  };
});
