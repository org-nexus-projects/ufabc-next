import { backofficeRoutes } from './backoffice.route.js';
import type { FastifyInstance } from 'fastify';

export async function backOfficeModule(app: FastifyInstance) {
  await app.register(backofficeRoutes, {
    prefix: '/backoffice',
  });
}
