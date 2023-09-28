import type { FastifyInstance } from 'fastify';
import { nextSummaryHandler } from './nextSummary.routes';

// export const autoPrefix = '/v2';
export default async function nextSummary(app: FastifyInstance) {
  app.get('/summary', nextSummaryHandler);
}
