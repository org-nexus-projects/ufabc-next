import type { FastifyInstance } from 'fastify';
import { nextSummary } from './handlers/nextSummary.js';

export default async function (app: FastifyInstance) {
  app.get('/summary', nextSummary);
}
