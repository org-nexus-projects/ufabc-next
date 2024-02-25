import gracefullyShutdown from 'close-with-grace';
import { logger } from '@next/common';
import { Config } from './config/config.js';
import { buildApp } from './app.js';
import { nextWorker } from './queue/NextWorker.js';
import { nextJobs } from './queue/NextJobs.js';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { FastifyServerOptions } from 'fastify';

const appOptions = {
  logger,
} satisfies FastifyServerOptions;

async function start() {
  const app = await buildApp(appOptions);
  if (Config.NODE_ENV === 'dev') {
    app.log.info(app.printRoutes());
  }

  app.withTypeProvider<ZodTypeProvider>();
  await app.listen({ port: Config.PORT, host: Config.HOST });

  nextJobs.setup();
  nextWorker.setup();

  nextJobs.schedule('NextSyncMatriculas', {
    operation: 'alunos_matriculados',
  });

  gracefullyShutdown({ delay: 500 }, async ({ err, signal }) => {
    if (err) {
      app.log.fatal({ err }, 'error starting app');
    }

    app.log.info({ signal }, 'Gracefully exiting app');
    await nextJobs.close();
    await nextWorker.close();
    await app.close();
    process.exit(1);
  });
}

await start();
