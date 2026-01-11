import type { DatabaseModels } from '@next/db/models';
import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import type { Mongoose } from 'mongoose';

import { fastifyAutoload } from '@fastify/autoload';
import dbPlugin from '@next/db/client';
import {
  RequestValidationError,
  ResponseSerializationError,
} from 'fastify-zod-openapi';
import { join } from 'node:path';

import backofficeController from './controllers/backoffice-controller.js';
import componentsController from './controllers/components-controller.js';
import studentsController from './controllers/students-controller.js';
import webhookController from './controllers/webhook-controller.js';
import { authenticateBoard } from './hooks/board-authenticate.js';
import awsV2Plugin from './plugins/v2/aws.js';
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
  webhookController,
  studentsController,
];

export async function buildApp(
  app: FastifyInstance,
  opts: FastifyServerOptions = {}
) {
  await setupV2Routes(app, routesV2);

  await app.register(fastifyAutoload, {
    dir: join(import.meta.dirname, 'plugins/external'),
    options: { ...opts },
  });

  await app.register(fastifyAutoload, {
    dir: join(import.meta.dirname, 'plugins/custom'),
    options: { ...opts },
  });

  await app.register(redisV2Plugin);
  await app.register(dbPlugin);
  await app.register(queueV2Plugin, {
    redisURL: new URL(app.config.REDIS_CONNECTION_URL),
  });
  await app.register(awsV2Plugin);

  app.register(fastifyAutoload, {
    dir: join(import.meta.dirname, 'routes'),
    autoHooks: true,
    cascadeHooks: true,
    ignorePattern: /^.*(?:test|spec|service|sync).(ts|js)$/,
    options: { ...opts },
  });

  await app.register(testUtilsPlugin);

  await app.manager.start();
  await app.manager.board({ authenticate: authenticateBoard });

  app.worker.setup();
  await app.job.setup();

  app.get('/health', (request, reply) => {
    return reply.status(200).send({ message: 'OK' });
  });

  app.setSchemaErrorFormatter((errors, dataVar) => {
    let message = `${dataVar}:`;
    for (const error of errors) {
      if (error instanceof RequestValidationError) {
        message += ` ${error.instancePath} ${error.keyword}`;
      }
    }

    return new Error(message);
  });

  app.setErrorHandler((error, request, reply) => {
    reply.error = error as Error;

    if (error instanceof ResponseSerializationError) {
      return reply.status(422).send({
        zodIssues: error.validation?.map((err) => err.params.issue) ?? [],
        originalError: error.validation?.[0]?.params.error ?? null,
      });
    }
    if (error instanceof Error) {
      request.log.error(
        {
          error,
          request: {
            method: request.method,
            url: request.url,
            query: request.query,
            params: request.params,
          },
        },
        error.message
      );

      return reply.status(500).send({
        error: error.name,
        statusCode: 500,
        message: error.message,
      });
    }

    if (!error) {
      return;
    }
  });

  app.setNotFoundHandler(
    {
      preHandler: app.rateLimit({
        max: 3,
        timeWindow: 500,
      }),
    },
    (request, reply) => {
      request.log.warn(
        {
          request: {
            method: request.method,
            url: request.url,
            query: request.query,
            params: request.params,
          },
        },
        'Resource not found'
      );

      reply.code(404);

      return { message: 'Not Found' };
    }
  );
}
