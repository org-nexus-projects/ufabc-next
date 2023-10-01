import type { FastifyInstance } from 'fastify';
import { authenticate } from '@modules/user/hooks/authenticate';
import { listEnrollments } from './handlers/listEnrollments';
import { type RouteParams, enrollment } from './handlers/enrollment';

export const autoPrefix = '/v2';
export default async function (app: FastifyInstance) {
  app.get('/enrollments', { onRequest: [authenticate] }, listEnrollments);
  app.get<{ Params: RouteParams }>(
    '/enrollments/:enrollmentId',
    { onRequest: [authenticate] },
    enrollment,
  );
}
