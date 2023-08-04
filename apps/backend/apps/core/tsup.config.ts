import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts', '!src/@types'],
  target: ['node16'],
  clean: true,
  treeshake: true,
});
