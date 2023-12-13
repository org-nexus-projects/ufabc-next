import { listEnrollments } from './handlers/listEnrollments.js';
import { enrollment } from './handlers/enrollment.js';
import { enrollmentSchema, listEnrollmentsSchema } from './schema.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function enrollmentsRoute(app: FastifyInstance) {
  app.get('/', { schema: listEnrollmentsSchema }, listEnrollments);
  app.get('/:enrollmentId', { schema: enrollmentSchema }, enrollment);
}
