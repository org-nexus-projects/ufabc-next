import { join } from 'node:path';

import { fastifyAutoload } from '@fastify/autoload';
import dbPlugin from '@next/db/client';
import { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { authenticationController } from './controllers/authentication-controller.js';
import backofficeController from './controllers/backoffice-controller.js';
import componentsController from './controllers/components-controller.js';
import { proxyController } from './controllers/proxy-controller.js';
import studentsController from './controllers/students-controller.js';
import { UfabcParserIncomingWebhookController } from './controllers/ufabc-parser-webhook-controller.js';
import { authenticateBoard } from './hooks/board-authenticate.js';
import awsV2Plugin from './plugins/v2/aws.js';
import queueV2Plugin from './plugins/v2/queue.js';
import redisV2Plugin from './plugins/v2/redis.js';
import { setupV2Routes } from './plugins/v2/setup.js';
import testUtilsPlugin from './plugins/v2/test-utils.js';

const routesV2 = [
  componentsController,
  backofficeController,
  studentsController,
  UfabcParserIncomingWebhookController,
  authenticationController,
  proxyController,
];

export async function buildApp(
  app: FastifyInstance,
  opts: FastifyServerOptions = {}
) {
  await app.register(fastifyAutoload, {
    dir: join(import.meta.dirname, 'plugins/external'),
    options: { ...opts },
  });

  await app.register(redisV2Plugin);

  await app.register(fastifyAutoload, {
    dir: join(import.meta.dirname, 'plugins/custom'),
    options: { ...opts },
  });

  await app.register(dbPlugin, {
    mongodbConnectionUrl: app.config.MONGODB_CONNECTION_URL,
    nodeEnv: app.config.NODE_ENV,
    logLevel: app.config.LOG_LEVEL,
  });
  await app.register(queueV2Plugin);
  await app.register(awsV2Plugin);

await setupV2Routes(app, routesV2);

  app.register(fastifyAutoload, {
    autoHooks: true,
    cascadeHooks: true,
    dir: join(import.meta.dirname, 'routes'),
    ignorePattern: /^.*(?:test|spec|service|sync).(ts|js)$/,
    options: { ...opts },
  });

  await app.register(testUtilsPlugin);

  await app.manager.start();
  await app.manager.board({ authenticate: authenticateBoard });

  app.worker.setup();
  await app.job.setup();

  app.get('/health', (request, reply) =>
    reply.status(200).send({ message: 'OK' })
  );
}
