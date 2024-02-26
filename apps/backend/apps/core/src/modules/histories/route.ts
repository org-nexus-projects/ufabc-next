import { createHistory } from './handlers/createHistory.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function historiesRoute(app: FastifyInstance) {
  app.post('/', createHistory);
}
