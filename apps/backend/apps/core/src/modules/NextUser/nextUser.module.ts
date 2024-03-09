import { accountRoutes } from './account/account.route.js';
import type { FastifyInstance } from 'fastify';

export async function nextUserRoutes(app: FastifyInstance) {
  // account routes
  await app.register(accountRoutes, {
    prefix: '/users',
  });
}
