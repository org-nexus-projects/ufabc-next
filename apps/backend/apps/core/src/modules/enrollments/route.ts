import { listEnrollments } from './handlers/listEnrollments.js';
import { type RouteParams, enrollment } from './handlers/enrollment.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function enrollmentsRoute(app: FastifyInstance) {
  app.get('/', listEnrollments);
  app.get<{ Params: RouteParams }>('/:enrollmentId', enrollment);
}
