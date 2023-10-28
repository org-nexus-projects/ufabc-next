import gracefullyShutdown from 'close-with-grace';
import { logger } from '@next/common';
import { Config } from './config/config.js';
import { buildApp } from './app.js';
import type { FastifyServerOptions } from 'fastify';

const appOptions = {
  logger,
} satisfies FastifyServerOptions;

async function start() {
  const app = await buildApp(appOptions);
  if (Config.NODE_ENV === 'dev') {
    app.log.info(app.printRoutes());
  }

  await app.listen({ port: Config.PORT, host: Config.HOST });

  gracefullyShutdown({ delay: 500 }, async ({ err, signal }) => {
    if (err) {
      app.log.fatal({ err }, 'error starting app');
    }

    app.log.info({ signal }, 'Gracefully exiting app');
    await app.close();
    process.exit(1);
  });
}

await start();
