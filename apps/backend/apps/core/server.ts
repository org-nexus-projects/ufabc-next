import type { FastifyServerOptions } from 'fastify';
import gracefullyShutdown from 'close-with-grace';
import { buildApp } from './app';

const appOptions = {
  logger: true,
} satisfies FastifyServerOptions;

async function start() {
  const app = await buildApp(appOptions);
  app.log.info(app.printRoutes());

  await app.listen({ port: 5000, host: '0.0.0.0' });

  gracefullyShutdown({ delay: 500 }, async ({ err, signal }) => {
    if (err) {
      app.log.fatal({ err }, 'error starting app');
    }
    app.log.info({ signal }, 'Gracefully exiting app');
    await app.close();
  });
}

start();
