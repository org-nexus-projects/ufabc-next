import { healthCheck as healthCheckHandler } from './handlers/healthCheck.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function healthCheckRoute(app: FastifyInstance) {
  app.get('/healthcheck', healthCheckHandler);
}
