import { getStatusCheck } from './handlers/statusCheck.js';
import { statusCheckSchema } from './schema.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function statusRoute(app: FastifyInstance) {
  app.get('/healthcheck', { schema: statusCheckSchema }, getStatusCheck);
}
