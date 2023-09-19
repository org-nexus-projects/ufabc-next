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
    platform: 'node',
    format: 'cjs',
    external: ['mongoose'],
    plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
  });
})();
