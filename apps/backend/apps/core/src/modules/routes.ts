import { authenticate } from '@/hooks/authenticate.js';
import { summaryRoute } from './nextSummary/route.js';
import { enrollmentsRoute } from './enrollments/route.js';
import { healthCheckRoute } from './healthCheck/route.js';
import type { FastifyInstance } from 'fastify';

export async function publicRoutes(app: FastifyInstance) {
  await app.register(healthCheckRoute);
  await app.register(summaryRoute);
}

export async function nextRoutes(app: FastifyInstance) {
  // auth every route from here
  app.addHook('onRequest', authenticate);

  await app.register(enrollmentsRoute, {
    prefix: '/enrollments',
  });
}
