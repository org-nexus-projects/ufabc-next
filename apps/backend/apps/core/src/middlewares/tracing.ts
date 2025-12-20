import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { TRACING_DIRECTION, TRACING_MESSAGES } from '../constants.js';
import { Security } from '../lib/security.js';

declare module 'fastify' {
  interface FastifyRequest {
    globalTraceId?: string;
  }
}

async function tracingPlugin(app: FastifyInstance) {
  app.addHook(
    'onRequest',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const incomingHeaders: Record<string, string | undefined> = {};
      for (const [key, value] of Object.entries(request.headers)) {
        incomingHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
      }

      const queryParams = request.query as Record<string, unknown>;
      const hasQueryParams = Object.keys(queryParams).length > 0;

      const redactedHeaders = Security.redactHeaders(incomingHeaders);
      const query = hasQueryParams ? queryParams : undefined;

      request.log.info(
        {
          direction: TRACING_DIRECTION.INCOMING,
          method: request.method,
          url: request.url,
          headers: redactedHeaders,
          queryParams: query,
          params: request.params as Record<string, unknown>,
        },
        TRACING_MESSAGES.INCOMING_REQUEST,
      );
    },
  );

  app.addHook(
    'onError',
    async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
      request.error = error;
    },
  );

  app.addHook(
    'onResponse',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const duration = request.startTime ? Date.now() - request.startTime : 0;
      const status = reply.statusCode;

      const outgoingHeaders: Record<string, string | undefined> = {};
      for (const [key, value] of Object.entries(reply.getHeaders())) {
        if (Array.isArray(value)) {
          outgoingHeaders[key] = value.join(', ');
        } else if (typeof value === 'string') {
          outgoingHeaders[key] = value;
        } else if (typeof value === 'number') {
          outgoingHeaders[key] = String(value);
        } else {
          outgoingHeaders[key] = undefined;
        }
      }

      const redactedOutgoingHeaders = Security.redactHeaders(outgoingHeaders);
      const error = request.error;
      const queryParams = request.query as Record<string, unknown>;
      const params = request.params as Record<string, unknown>;
      const requester = request.headers['requester-key'] as string | undefined;

      const logData = {
        direction: TRACING_DIRECTION.OUTGOING,
        method: request.method,
        path: request.url,
        status,
        duration: `${duration}ms`,
        headers: redactedOutgoingHeaders,
        userAgent: request.headers['user-agent'],
        ip:
          (request.headers['x-forwarded-for'] as string | undefined) ||
          (request.headers['x-real-ip'] as string | undefined),
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
        queryParams,
        params,
        requester,
      };

      if (status >= 500) {
        request.log.error(
          logData,
          TRACING_MESSAGES.OUTGOING_RESPONSE_WITH_5XX_STATUS,
        );
      } else if (status >= 400) {
        request.log.warn(
          logData,
          TRACING_MESSAGES.OUTGOING_RESPONSE_WITH_4XX_STATUS,
        );
      } else {
        request.log.info(logData, TRACING_MESSAGES.OUTGOING_RESPONSE);
      }
    },
  );
}

export const tracingMiddleware = fp(tracingPlugin, {
  name: 'tracing',
});
