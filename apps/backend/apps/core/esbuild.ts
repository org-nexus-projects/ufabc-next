import { build } from 'esbuild';
import esbuildPluginPino from 'esbuild-plugin-pino';
import glob from 'tiny-glob';

(async () => {
  const entryPoints = await glob('src/**/*.ts')

  build({
    entryPoints,
    logLevel: 'info',
    outdir: 'dist',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    plugins: [
      esbuildPluginPino({ transports: ['pino-pretty'] })
    ]
  })

})()
