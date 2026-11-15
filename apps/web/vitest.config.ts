/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    alias: {
      '@': '/src',
    },
    coverage: {
      all: true,
      exclude: [
        '**/dist/**',
        '**/node_modules/**',
        '**/test-utils.ts',
        '**/mocks/**',
        'eslint.config.js',
        'mf.config.js',
        'remotes.hosts.local.js',
        'remotes.hosts.production.js',
        'remotes.hosts.staging.js',
        'vue.config.js',
        'src/bootstrap.ts',
        'src/main.ts',
        '**/*.d.ts',
      ],
      provider: 'v8',
      reportOnFailure: true,
      reporter: ['text', 'html'],
    },
    env: {
      VITE_API_BASE_URL: 'http://localhost:5000',
      VITE_APP_BASE_URL: '/',
      VITE_APP_ENV: 'local',
      VITE_PARSER_API_BASE_URL: 'https://ufabc-parser.com/v2',
    },
    environment: 'jsdom',
    globals: true,
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
    setupFiles: ['./setup-tests.ts'],
  },
});
