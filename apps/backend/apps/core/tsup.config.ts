import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts'],
  format: 'esm',
  clean: true,
  splitting: false,
  tsconfig: './tsconfig.json',
});
