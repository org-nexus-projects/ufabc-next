import type { FastifyInstance } from 'fastify';
import { healthCheck } from './handlers/healthCheck.js';

export const autoPrefix = '/v2';
export default async function (app: FastifyInstance) {
  app.get('/healthcheck', healthCheck);
}
