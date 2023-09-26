import type { FastifyInstance } from 'fastify';
import { authenticate } from '@modules/user/hooks/authenticate';
import { listEnrollments } from './handlers/listEnrollments';
import { enrollment } from './handlers/enrollment';
import type { ObjectId } from 'mongoose';

type RouteParams = { enrollmentId: ObjectId };

// TODO: fix prefix
export default async function (app: FastifyInstance) {
  app.get('/v2/enrollments', { onRequest: [authenticate] }, listEnrollments);
  app.get<{ Params: RouteParams }>(
    '/v2/enrollments/:enrollmentId',
    { onRequest: [authenticate] },
    enrollment,
  );
}
