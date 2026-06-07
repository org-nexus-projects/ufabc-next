import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/server.ts', 'src/browser.ts'],
  format: 'esm',
  dts: { tsgo: true },
  clean: true,
})
