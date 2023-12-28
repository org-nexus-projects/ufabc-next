import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/setup.ts'],
  format: 'esm',
  platform: 'node',
  target: ['node20'],
  sourcemap: true,
  dts: true,
});
