import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import {
  validatorCompiler,
  serializerCompiler,
  RequestValidationError,
  ResponseSerializationError,
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
    ignorePattern: /^.*(?:test|spec|service).(ts|js)$/,
    options: { ...opts },
  });

  app.worker.setup();
  app.job.setup();

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
    if (error instanceof ResponseSerializationError) {
      app.log.error(
        {
          error,
          request: {
            method: request.method,
            url: request.url,
            query: request.query,
            params: request.params,
          },
        },
        'Error serializing response',
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

    if (error) {
      app.log.error(
        {
          error,
          request: {
            method: request.method,
            url: request.url,
            query: request.query,
            params: request.params,
          },
        },
        'Unhandled error occurred',
      );

      reply.code(error.statusCode ?? 500);

      let message = 'Internal Server Error';
      if (error.statusCode && error.statusCode < 500) {
        message = error.message;
      }

      return { message };
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
