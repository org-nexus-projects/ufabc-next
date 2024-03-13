import { teacherRoutes } from './teachers/teacher.route.js';
import type { FastifyInstance } from 'fastify';

export async function entitiesModule(app: FastifyInstance) {
  await app.register(teacherRoutes, {
    prefix: '/entities',
  });
}
