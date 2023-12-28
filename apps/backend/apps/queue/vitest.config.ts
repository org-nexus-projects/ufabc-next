import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
    coverage: {
      thresholds: {
        statements: 10,
        functions: 10,
        lines: 10,
        branches: 10,
      },
      reportOnFailure: true,
    },
  },
});
