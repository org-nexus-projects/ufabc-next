import { TRACING_DIRECTION, TRACING_MESSAGES } from '@/constants.js';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyBaseLogger } from 'fastify';

declare module '@fastify/request-context' {
  interface RequestContextData {
    log: FastifyBaseLogger;
    traceId: string;
  }
}

declare module 'fastify' {
  interface FastifyReply {
    error: Error;
  }
}

export default fp(async (app) => {
  app.addHook('onRequest', async (request) => {
    request.requestContext.set('log', request.log);
    request.requestContext.set('traceId', request.id);

    request.log.info(
      {
        direction: TRACING_DIRECTION.INCOMING,
        method: request.method,
        url: request.url,
        headers: request.headers, // Redaction should happen at the Pino level
        queryParams: request.query,
      },
      TRACING_MESSAGES.INCOMING_REQUEST
    );
  });

  app.addHook('onResponse', async (request, reply) => {
    const status = reply.statusCode;

    const logData = {
      direction: TRACING_DIRECTION.OUTGOING,
      method: request.method,
      path: request.url,
      status,
      duration: reply.elapsedTime,
      headers: reply.getHeaders(),
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      queryParams: request.query,
      params: request.params,
    };

    const hasError = !!reply.error;

    if (status >= 500) {
      request.log.error(
        { ...logData, ...(hasError && { error: reply.error }) },
        TRACING_MESSAGES.OUTGOING_RESPONSE_WITH_5XX_STATUS
      );
    } else if (status >= 400) {
      request.log.warn(
        { ...logData, ...(hasError && { error: reply.error }) },
        TRACING_MESSAGES.OUTGOING_RESPONSE_WITH_4XX_STATUS
      );
    } else {
      request.log.info(logData, TRACING_MESSAGES.OUTGOING_RESPONSE);
    }
  });
});
