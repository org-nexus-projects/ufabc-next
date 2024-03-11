import { accountRoutes } from './account/account.route.js';
import { historyRoutes } from './history/history.route.js';
import type { FastifyInstance } from 'fastify';

export async function nextUserRoutes(app: FastifyInstance) {
  await app.register(accountRoutes, {
    prefix: '/users',
  });
  await app.register(historyRoutes, {
    prefix: '/histories',
  });
}
