import { accountRoutes } from './account/account.route.js';
import { courseStatsRoute } from './courseStats/courseStats.route.js';
import { graduationRoutes } from './graduation/graduation.route.js';
import { historyRoutes } from './history/history.route.js';
import type { FastifyInstance } from 'fastify';

export async function nextUserRoutes(app: FastifyInstance) {
  await app.register(accountRoutes, {
    prefix: '/users',
  });
  await app.register(historyRoutes, {
    prefix: '/histories',
  });
  await app.register(graduationRoutes, {
    prefix: '/graduations',
  });
  await app.register(courseStatsRoute, {
    prefix: '/courseStats',
  });
}
