import { serializeQueryParams } from '@next/logger/sanitize';
import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import {
  RequestValidationError,
  ResponseSerializationError,
} from 'fastify-zod-openapi';

import { NextError } from '@/errors/base-error.js';

export default fp(
  (app: FastifyInstance) => {
    app.setErrorHandler(
      (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        reply.error = error as Error;

        const requestContext = {
          method: request.method,
          params: request.params,
          query: serializeQueryParams(request.query),
          url: request.url,
        };

        if (error instanceof ResponseSerializationError) {
          reply.status(422);
          reply.send({
            originalError: error.validation?.[0]?.params.error ?? null,
            zodIssues: error.validation?.map((err) => err.params.issue) ?? [],
          });
          return;
        }

        if (
          error instanceof RequestValidationError ||
          (error &&
            typeof error === 'object' &&
            'validation' in error &&
            error.validation)
        ) {
          const validationError = error as Error & { validation: unknown[] };

          request.log.warn(
            { error: validationError, request: requestContext },
            validationError.message
          );

          reply.status(400);
          reply.send({
            error: 'Bad Request',
            message: validationError.message,
            statusCode: 400,
            validation: validationError.validation,
          });
          return;
        }

        if (error instanceof NextError) {
          request.log.warn(
            { error, request: requestContext },
            error.description
          );

          const httpBody = error.toHttp();
          reply.status(httpBody.statusCode);
          reply.send(httpBody);
          return;
        }

        if (error instanceof Error) {
          request.log.error(
            { error, request: requestContext },
            error.message
          );

          reply.status(500);
          reply.send({
            error: error.name,
            message: error.message,
            statusCode: 500,
          });
          return;
        }

        if (!error) {
          return;
        }
      }
    );
  },
  { name: 'error-handler' }
);
