import type { FastifyInstance } from 'fastify';
import { healthCheck } from './handlers/healthCheck.js';

export default async function (app: FastifyInstance) {
  app.get('/healthcheck', healthCheck);
}
