import { join } from 'node:path';

import { fastifyAutoload } from '@fastify/autoload';
import dbPlugin from '@next/db/client';
import type { DatabaseModels } from '@next/db/models';
import { serializeQueryParams } from '@next/logger/sanitize';
import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import { RequestValidationError } from 'fastify-zod-openapi';
import type { Mongoose } from 'mongoose';

import { authenticationController } from './controllers/authentication-controller.js';
import backofficeController from './controllers/backoffice-controller.js';
import componentsController from './controllers/components-controller.js';
import { proxyController } from './controllers/proxy-controller.js';
import studentsController from './controllers/students-controller.js';
import { UfabcParserIncomingWebhookController } from './controllers/ufabc-parser-webhook-controller.js';
import { authenticateBoard } from './hooks/board-authenticate.js';
import awsV2Plugin from './plugins/v2/aws.js';
import errorHandlerPlugin from './plugins/v2/error-handler.js';
import memoryMonitorPlugin from './plugins/v2/memory-monitor.js';
import queueV2Plugin from './plugins/v2/queue.js';
import redisV2Plugin from './plugins/v2/redis.js';
import { setupV2Routes } from './plugins/v2/setup.js';
import testUtilsPlugin from './plugins/v2/test-utils.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: DatabaseModels;
    rawMongoose: Mongoose;
  }
}

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

  await app.register(fastifyAutoload, {
    dir: join(import.meta.dirname, 'plugins/custom'),
    options: { ...opts },
  });

  await app.register(redisV2Plugin);
  await app.register(dbPlugin, { config: app.config });
  await app.register(queueV2Plugin, {
    redisURL: new URL(app.config.REDIS_CONNECTION_URL),
  });
  await app.register(awsV2Plugin);
  await app.register(memoryMonitorPlugin);

  await setupV2Routes(app, routesV2);

  app.setSchemaErrorFormatter((errors, dataVar) => {
    let message = `${dataVar}:`;
    for (const error of errors) {
      if (error instanceof RequestValidationError) {
        message += ` ${error.instancePath} ${error.keyword}`;
      } else if (error.instancePath && error.keyword) {
        message += ` ${error.instancePath} ${error.keyword}`;
      }
    }

    return new Error(message);
  });

  await app.register(errorHandlerPlugin);

  app.setNotFoundHandler((request, reply) => {
    request.log.warn(
      {
        request: {
          method: request.method,
          params: request.params,
          query: serializeQueryParams(request.query),
          url: request.url,
        },
      },
      'Resource not found'
    );

    reply.code(404);

    return { message: 'Not Found' };
  });

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
