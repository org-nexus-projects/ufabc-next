import { authenticate } from '@/modules/user/hooks/authenticate.js';
import { listEnrollments } from './handlers/listEnrollments.js';
import { type RouteParams, enrollment } from './handlers/enrollment.js';
import type { FastifyInstance } from 'fastify';

export const autoPrefix = '/enrollments';
// eslint-disable-next-line require-await
export default async function (app: FastifyInstance) {
  app.get('/', { onRequest: [authenticate] }, listEnrollments);
  app.get<{ Params: RouteParams }>(
    '/:enrollmentId',
    { onRequest: [authenticate] },
    enrollment,
  );
}
