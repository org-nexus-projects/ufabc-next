import { nextSummary } from './handlers/nextSummary.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export default async function (app: FastifyInstance) {
  app.get('/summary', nextSummary);
}
