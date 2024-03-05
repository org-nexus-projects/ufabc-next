import { listReviews } from './handlers/listReviewsSubject.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function subjectRoute(app: FastifyInstance) {
  app.get('/reviews/:subjectId', listReviews);
}
