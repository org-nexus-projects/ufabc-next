import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 60_000,
    hookTimeout: 45_000,
    mockReset: true,
    restoreMocks: true,
    server: {
      deps: {
        inline: ['@fastify/autoload'],
      },
    },
  },
});
