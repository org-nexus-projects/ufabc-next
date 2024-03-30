import type { FastifyInstance } from 'fastify';

export async function syncModule(app: FastifyInstance) {
  await app.register(syncRoutes, {
    prefix: '/sync',
  });
}
