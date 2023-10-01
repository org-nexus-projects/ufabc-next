import { build } from 'esbuild';
import esbuildPluginPino from 'esbuild-plugin-pino';
import glob from 'tiny-glob';
const allFiles = await glob('src/**/*.ts');
const handlersFiles = await glob('src/**/handlers/*.ts');
const entryPoints = allFiles.filter((files) => !handlersFiles.includes(files));

await build({
  entryPoints: allFiles,
  logLevel: 'info',
  outdir: 'dist',
  target: 'esnext',
  bundle: true,
  sourcemap: true,
  platform: 'node',
  format: 'esm',
  // packages: 'external',
  packages: 'external',
  // @ts-expect-error Library problem
  plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
});
