import { commentRoute } from './comments/comments.route.js';
import { courseStatsRoute } from './courseStats/courseStats.route.js';
import { graduationRoutes } from './graduation/graduation.route.js';
import type { FastifyInstance } from 'fastify';

export async function userModule(app: FastifyInstance) {
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
