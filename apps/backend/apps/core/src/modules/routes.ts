import { authenticate } from '@/hooks/authenticate.js';
import { privateRoutes } from './private/route.js';
import { disciplinasRoute } from './disciplinas/route.js';
import type { FastifyInstance } from 'fastify';

export async function publicRoutes(app: FastifyInstance) {
  await app.register(disciplinasRoute, {
    prefix: '/v2/disciplinas',
  });
}

export async function internalRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);
  await app.register(privateRoutes, {
    prefix: '/private',
  });
}
