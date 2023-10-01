import type { FastifyServerOptions } from 'fastify';
import gracefullyShutdown from 'close-with-grace';
import { logger } from '@ufabcnext/common';
import { Config } from './config/index.js';
import { buildApp } from './app.js';

const appOptions = {
  logger,
} satisfies FastifyServerOptions;

async function start() {
  const app = await buildApp(appOptions);
  if (Config.NODE_ENV === 'dev') {
    app.log.info(app.printRoutes());
  }

  app.log.info(app.printRoutes());
  await app.listen({ port: Config.PORT, host: Config.HOST });

  gracefullyShutdown({ delay: 500 }, async ({ err, signal }) => {
    if (err) {
      app.log.fatal({ err }, 'error starting app');
    }
    app.log.info({ signal }, 'Gracefully exiting app');
    await app.close();
  });
}

start();
