import type { FastifyInstance } from 'fastify';
import { componentStats } from './handlers/components.js';

export async function publicStatsRoute(app: FastifyInstance) {
  app.get('/stats/components/:action', componentStats);
  app.get('/stats/components', componentStats);
}
