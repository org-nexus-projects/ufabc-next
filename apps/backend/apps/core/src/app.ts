import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import { entitiesModule } from './modules/entities/entities.module.js';
import { publicModule } from './modules/public/public.module.js';
import { userModule } from './modules/user/user.module.js';
import { syncModule } from './modules/sync/sync.module.js';
import {
  validatorCompiler,
  serializerCompiler,
  RequestValidationError,
} from 'fastify-zod-openapi';
import { fastifyAutoload } from '@fastify/autoload';
import { join } from 'node:path';

export async function buildApp(
  app: FastifyInstance,
  opts: FastifyServerOptions = {},
) {
  // for zod open api
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(fastifyAutoload, {
    dir: join(import.meta.dirname, 'plugins/external'),
    options: { ...opts },
  });

  await app.register(fastifyAutoload, {
    dir: join(import.meta.dirname, 'plugins/custom'),
    options: { ...opts },
  });

  // TODO: validate this idea
  app.register(fastifyAutoload, {
    dir: join(import.meta.dirname, 'routes'),
    autoHooks: true,
    cascadeHooks: true,
    options: { ...opts },
  });

  app.worker.setup();
  app.worker.setup();

  // await app.register(userModule, {
  //   prefix: '/v2',
  // });
  // await app.register(entitiesModule, {
  //   prefix: '/v2',
  // });
  // await app.register(publicModule, {
  //   prefix: '/v2',
  // });
  // await app.register(syncModule, {
  //   prefix: '/v2',
  // });

  app.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      const zodValidationErrors = error.validation.filter(
        (err) => err instanceof RequestValidationError,
      );
      const zodIssues = zodValidationErrors.map((err) => err.params.issue);
      const originalError = zodValidationErrors?.[0]?.params.error;
      return reply.status(422).send({
        zodIssues,
        originalError,
      });
    }
  });

  app.setErrorHandler((err, request, _reply) => {
    app.log.error(
      {
        err,
        request: {
          method: request.method,
          url: request.url,
          query: request.query,
          params: request.params,
        },
      },
      'Unhandled error occurred',
    );

    let message = 'Internal Server Error';
    if (err.statusCode && err.statusCode < 500) {
      message = err.message;
    }

    return { message };
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
