import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: { tsgo: true },
  entry: ['src/server.ts', 'src/browser.ts'],
  format: 'esm',
});
