import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import {
  RequestValidationError,
  ResponseSerializationError,
} from 'fastify-zod-openapi';

import { NextError } from '@/errors/next-error.js';

export default fp(
  async (app: FastifyInstance) => {
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

    app.setErrorHandler((error, request, reply) => {
      reply.error = error as Error;

      if (error instanceof ResponseSerializationError) {
        reply.status(422);
        reply.send({
          originalError: error.validation?.[0]?.params.error ?? null,
          zodIssues: error.validation?.map((err) => err.params.issue) ?? [],
        });
        return;
      }

      if (error instanceof NextError) {
        request.log.warn(
          {
            error,
            request: {
              method: request.method,
              params: request.params,
              query: request.query,
              url: request.url,
            },
          },
          error.message
        );

        reply.status(error.status);
        reply.send({
          code: error.code,
          description: error.description,
          status: error.status,
          title: error.title,
          ...(error.additionalData && {
            additionalData: error.additionalData,
          }),
        });
        return;
      }

      if (
        error &&
        typeof error === 'object' &&
        'validation' in error &&
        error.validation
      ) {
        const validationError = error as Error & { validation: unknown[] };

        request.log.warn(
          {
            error: validationError,
            request: {
              method: request.method,
              params: request.params,
              query: request.query,
              url: request.url,
            },
          },
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

      if (error instanceof Error) {
        request.log.error(
          {
            error,
            request: {
              method: request.method,
              params: request.params,
              query: request.query,
              url: request.url,
            },
          },
          error.message
        );

        reply.status(500);
        reply.send({
          code: 'NEX000004',
          description: 'Internal Server Error',
          status: 500,
          title: 'Internal Server Error',
        });
      }
    });

    app.setNotFoundHandler((request, reply) => {
      request.log.warn(
        {
          request: {
            method: request.method,
            params: request.params,
            query: request.query,
            url: request.url,
          },
        },
        'Resource not found'
      );

      reply.code(404);

      return { message: 'Not Found' };
    });
  },
  { name: 'error-handler' }
);
