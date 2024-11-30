import { commentRoute } from './comments/comments.route.js';
import { courseStatsRoute } from './courseStats/courseStats.route.js';
import type { FastifyInstance } from 'fastify';

export async function userModule(app: FastifyInstance) {
  await app.register(courseStatsRoute, {
    prefix: '/courseStats',
  });
  await app.register(commentRoute, {
    prefix: '/comments',
  });
}
