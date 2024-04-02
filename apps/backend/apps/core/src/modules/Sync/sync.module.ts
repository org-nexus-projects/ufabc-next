import { syncRoutes } from './sync.route.js';
import type { FastifyInstance } from 'fastify';

export async function syncModule(app: FastifyInstance) {
  await app.register(syncRoutes, {
    prefix: '/sync',
  });
}
