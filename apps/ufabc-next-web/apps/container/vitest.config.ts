/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue() as any],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
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
      all: true,
      reportOnFailure: true,
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    alias: {
      '@': '/src',
    },
    deps: {
      inline: ['vuetify'],
    },
    setupFiles: ['./setup-tests.ts'],
  },
});
