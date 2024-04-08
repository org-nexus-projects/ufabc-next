import { build } from 'esbuild';
import esbuildPluginPino from 'esbuild-plugin-pino';

await build({
  entryPoints: ['src/server.ts'],
  logLevel: 'info',
  outdir: 'dist',
  target: 'node21',
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  // @ts-expect-error Library problem
  plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
});
