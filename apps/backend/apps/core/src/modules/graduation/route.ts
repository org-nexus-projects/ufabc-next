import { graduation } from './handlers/graduation.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function graduationsRoute(app: FastifyInstance) {
  app.get('/', graduation);
}
