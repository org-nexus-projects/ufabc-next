import type { FastifyInstance } from 'fastify';
import { healthCheckHandler } from './healthCheck.routes';

export default async function healthCheck(app: FastifyInstance) {
  app.get('/healthcheck', healthCheckHandler);
}
