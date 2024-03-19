import { authenticate } from '@/hooks/authenticate.js';
import { summaryRoute } from './nextSummary/route.js';
import { enrollmentsRoute } from './enrollments/route.js';
import { healthCheckRoute } from './healthCheck/route.js';
import { commentsRoute } from './comments/route.js';
import { privateRoutes } from './private/route.js';
import { reactionRoute } from './reactions/route.js';
import { disciplinasRoute } from './disciplinas/route.js';
import { subjectRoute } from './subjects/route.js';
import type { FastifyInstance } from 'fastify';

export async function publicRoutes(app: FastifyInstance) {
  await app.register(healthCheckRoute);
  await app.register(summaryRoute);
  await app.register(disciplinasRoute, {
    prefix: '/v2/disciplinas',
  });
  await app.register(subjectRoute, {
    prefix: '/v2/subjects',
  });
}

export async function nextRoutes(app: FastifyInstance) {
  // auth every route from here
  // app.addHook('onRequest', authenticate);

  await app.register(enrollmentsRoute, {
    prefix: '/enrollments',
  });
  await app.register(commentsRoute, {
    prefix: '/comments',
  });
  await app.register(reactionRoute, {
    prefix: '/reactions',
  });
}

export async function internalRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);
  await app.register(privateRoutes, {
    prefix: '/private',
  });
}
