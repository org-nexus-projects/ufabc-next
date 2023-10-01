import type { FastifyInstance } from 'fastify';
import { nextSummary } from './handlers/nextSummary.js';

export const autoPrefix = '/v2';
export default async function (app: FastifyInstance) {
  app.get('/summary', nextSummary);
}
