import { build } from 'esbuild';
import esbuildPluginPino from 'esbuild-plugin-pino';
import glob from 'tiny-glob';

void (async () => {
  const entryPoints = await glob('src/**/*.ts');
  await build({
    entryPoints,
    logLevel: 'info',
    outdir: 'dist',
    bundle: true,
    sourcemap: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
  });
})();
