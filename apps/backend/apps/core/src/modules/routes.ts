import { disciplinasRoute } from './disciplinas/route.js';
import type { FastifyInstance } from 'fastify';

export async function publicRoutes(app: FastifyInstance) {
  await app.register(disciplinasRoute, {
    prefix: '/v2/disciplinas',
  });
}
