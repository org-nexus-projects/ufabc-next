import { healthCheck as healthCheckHandler } from './handlers/healthCheck.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export default async function healthCheck(app: FastifyInstance) {
  app.get('/healthcheck', healthCheckHandler);
}
