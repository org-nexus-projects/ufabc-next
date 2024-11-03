import type { FastifyInstance } from 'fastify';
import fastifyUnderPressure from '@fastify/under-pressure';
import fp from 'fastify-plugin';

export const autoConfig = (app: FastifyInstance) => {
  return {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 100_000_000,
    maxRssBytes: 1_000_000_000,
    maxEventLoopUtilization: 0.98,
    message: 'The server is under pressure, retry later!',
    retryAfter: 50,
    healthCheck: async () => {
      try {
        return app.mongoose.connection.readyState === 1;
        /* c8 ignore start */
      } catch (err) {
        app.log.error(err, 'healthCheck has failed');
        throw new Error('Database connection is not available');
      }
      /* c8 ignore stop */
    },
    healthCheckInterval: 5000,
  };
};

/**
 * A Fastify plugin for mesuring process load and automatically
 * handle of "Service Unavailable"
 *
 * @see {@link https://github.com/fastify/under-pressure}
 *
 * Video on the topic: Do not thrash the event loop
 * @see {@link https://www.youtube.com/watch?v=VI29mUA8n9w}
 */
export default fp(fastifyUnderPressure, {
  dependencies: ['mongoose'],
});
