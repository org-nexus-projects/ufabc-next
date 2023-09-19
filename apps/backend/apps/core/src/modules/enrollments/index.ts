import type { FastifyInstance } from 'fastify';
import { authenticate } from '@modules/user/hooks/authenticate';
import { listEnrollments } from './handlers/enrollments';

// TODO: fix prefix
export default async function (app: FastifyInstance) {
  app.addHook('onRequest', authenticate);
  app.get('/v2/enrollments', listEnrollments);
}
