import type { FastifyInstance } from 'fastify';

import {
  DEPRECATION_HEADER,
  DEPRECATION_HEADER_VALUE,
  DEPRECATION_LOG_MESSAGE,
  DEPRECATION_METRIC_FAILED_MESSAGE,
  DEPRECATION_METRIC_PREFIX,
  DEPRECATION_METRIC_TTL,
} from '@/constants.js';

export function deprecationMetricKey(
  method: string,
  routeTemplate: string,
  moment: Date
) {
  const day = moment.toISOString().slice(0, 10);

  return `${DEPRECATION_METRIC_PREFIX}:${day}:${method}:${routeTemplate}`;
}

export function registerDeprecationNotice(app: FastifyInstance) {
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header(DEPRECATION_HEADER, DEPRECATION_HEADER_VALUE);

    return payload;
  });

  app.addHook('onResponse', async (request, reply) => {
    const routeTemplate = request.routeOptions.url ?? request.url;

    app.log.warn(
      {
        deprecation: {
          method: request.method,
          ra: request.user?.ra,
          route: routeTemplate,
          status: reply.statusCode,
          traceId: request.id,
        },
      },
      DEPRECATION_LOG_MESSAGE
    );

    try {
      await request.redisService.increment(
        deprecationMetricKey(request.method, routeTemplate, new Date()),
        DEPRECATION_METRIC_TTL
      );
    } catch (error) {
      app.log.error(
        { error, route: routeTemplate },
        DEPRECATION_METRIC_FAILED_MESSAGE
      );
    }
  });
}
