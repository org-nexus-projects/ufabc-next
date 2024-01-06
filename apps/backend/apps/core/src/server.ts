import gracefullyShutdown from 'close-with-grace';
import { logger } from '@next/common';
import { Config } from './config/config.js';
import { buildApp } from './app.js';
import { workersSetup } from './queue/setup.js';
// import { addSyncToQueue } from './queue/jobs/syncMatriculas.js';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { FastifyServerOptions } from 'fastify';

const appOptions = {
  logger,
} satisfies FastifyServerOptions;

const {
  emailWorker,
  enrollmentsWorker,
  // syncMatriculasWorker,
  teachersUpdateWorker,
  userEnrollmentsWorker,
} = workersSetup();

async function start() {
  const app = await buildApp(appOptions);
  if (Config.NODE_ENV === 'dev') {
    app.log.info(app.printRoutes());
  }

  app.withTypeProvider<ZodTypeProvider>();
  await app.listen({ port: Config.PORT, host: Config.HOST });
  // await addSyncToQueue({ operation: 'alunos_matriculados', redis: app.redis });

  gracefullyShutdown({ delay: 500 }, async ({ err, signal }) => {
    if (err) {
      app.log.fatal({ err }, 'error starting app');
    }

    app.log.info({ signal }, 'Gracefully exiting app');
    await Promise.all([
      emailWorker.close(),
      enrollmentsWorker.close(),
      userEnrollmentsWorker.close(),
      teachersUpdateWorker.close(),
      // syncMatriculasWorker.close(),
    ]);
    await app.close();
    process.exit(1);
  });
}

await start();
