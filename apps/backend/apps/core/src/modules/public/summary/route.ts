import { nextSummary } from './handlers/nextSummary.js';
import { summarySchema } from './schema.js';
import type { FastifyInstance } from 'fastify';


export async function summaryRoute(app: FastifyInstance) {
  app.get('/summary', { schema: summarySchema }, nextSummary);
}
