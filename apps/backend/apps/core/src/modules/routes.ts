import healthCheck from './healthCheck/route.js';
import summary from './nextSummary/route.js';
import type { FastifyInstance } from 'fastify';

export async function publicRoutes(app: FastifyInstance) {
  await app.register(healthCheck);
  await app.register(summary);
}
