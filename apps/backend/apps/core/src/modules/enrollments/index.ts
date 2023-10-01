import type { FastifyInstance } from 'fastify';
import { authenticate } from '@/modules/user/hooks/authenticate.js';
import { listEnrollments } from './handlers/listEnrollments.js';
import { enrollment, type RouteParams } from './handlers/enrollment.js';

export const autoPrefix = '/enrollments';
export default async function (app: FastifyInstance) {
  app.get('/', { onRequest: [authenticate] }, listEnrollments);
  app.get<{ Params: RouteParams }>(
    '/:enrollmentId',
    { onRequest: [authenticate] },
    enrollment,
  );
}
