import type { FastifyInstance } from 'fastify';
import { healthCheckHandler } from './healthCheck.routes';

// export const autoPrefix = '/v2';
export default async function healthCheck(app: FastifyInstance) {
  app.get('/healthcheck', healthCheckHandler);
}
