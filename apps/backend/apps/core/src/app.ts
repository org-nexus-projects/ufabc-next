import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import {
  RequestValidationError,
  ResponseSerializationError,
} from 'fastify-zod-openapi';
import { fastifyAutoload } from '@fastify/autoload';
import { join } from 'node:path';
import componentsController from './controllers/components-controller.js';
import { setupV2Routes } from './plugins/v2/setup.js';
import queueV2Plugin from './plugins/v2/queue.js';

const routesV2 = [componentsController];

export async function buildApp(
  app: FastifyInstance,
  opts: FastifyServerOptions = {},
) {
  // This allows both fastify-zod-openapi (old routes) and fastify-type-provider-zod (v2 routes) to coexist
  await setupV2Routes(app, routesV2);

  await app.register(fastifyAutoload, {
    dir: join(import.meta.dirname, 'plugins/external'),
    options: { ...opts },
  });

  await app.register(fastifyAutoload, {
    dir: join(import.meta.dirname, 'plugins/custom'),
    options: { ...opts },
  });

  await app.register(queueV2Plugin, {
    redisURL: new URL(app.config.REDIS_CONNECTION_URL),
  });

  app.register(fastifyAutoload, {
    dir: join(import.meta.dirname, 'routes'),
    autoHooks: true,
    cascadeHooks: true,
    ignorePattern: /^.*(?:test|spec|service).(ts|js)$/,
    options: { ...opts },
  });

  await app.manager.start();
  await app.manager.board();

  app.worker.setup();
  app.job.setup();

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
        error.message,
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
        'Resource not found',
      );

      reply.code(404);

      return { message: 'Not Found' };
    },
  );
}
