import { getStatusCheck } from './handlers/statusCheck.js';
// import { statusCheckSchema } from './schema.js';
import type { FastifyInstance } from 'fastify';


export async function statusRoute(app: FastifyInstance) {
  app.get('/status', getStatusCheck);
}
