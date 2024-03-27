import { accountRoutes } from './account/account.route.js';
import { commentRoute } from './comments/comments.route.js';
import { courseStatsRoute } from './courseStats/courseStats.route.js';
import { graduationRoutes } from './graduation/graduation.route.js';
import { historyRoutes } from './history/history.route.js';
import type { FastifyInstance } from 'fastify';

export async function nextUserModule(app: FastifyInstance) {
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
  await app.register(commentRoute, {
    prefix: '/comments',
  });
}
