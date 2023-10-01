import { build } from 'esbuild';
import esbuildPluginPino from 'esbuild-plugin-pino';
import glob from 'tiny-glob';
const entryPoints = await glob('src/**/*.ts');

await build({
  entryPoints,
  logLevel: 'info',
  outdir: 'dist',
  target: 'esnext',
  bundle: true,
  sourcemap: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  // @ts-expect-error Library problem
  plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
});
