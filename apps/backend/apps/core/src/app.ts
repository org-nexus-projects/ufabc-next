import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import { entitiesModule } from './modules/entities/entities.module.js';
import { publicModule } from './modules/public/public.module.js';
import { userModule } from './modules/user/user.module.js';
import { syncModule } from './modules/sync/sync.module.js';
import { backOfficeModule } from './modules/backoffice/backoffice.module.js';
import { nextJobs } from './queue/NextJobs.js';
import { nextWorker } from './queue/NextWorker.js';
// import { Config } from './config/config.js';
import { httpErrorsValidator } from './config/httpErrors.js';
import { validatorCompiler, serializerCompiler } from 'fastify-zod-openapi';
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

  nextJobs.setup();
  nextWorker.setup();

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
  // await app.register(backOfficeModule, {
  //   prefix: '/v2',
  // });

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
