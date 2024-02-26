import { authenticate } from '@/hooks/authenticate.js';
import { summaryRoute } from './nextSummary/route.js';
import { enrollmentsRoute } from './enrollments/route.js';
import { healthCheckRoute } from './healthCheck/route.js';
import { commentsRoute } from './comments/route.js';
import { userRoute } from './user/route.js';
import { privateRoutes } from './private/route.js';
import { graduationsRoute } from './user-graduation/route.js';
import { reactionRoute } from './reactions/route.js';
import { historiesRoute } from './histories/route.js';
import { disciplinasRoute } from './disciplinas/route.js';
import { studentRoute } from './student/route.js';
import type { FastifyInstance } from 'fastify';

export async function publicRoutes(app: FastifyInstance) {
  await app.register(healthCheckRoute);
  await app.register(summaryRoute);
  await app.register(historiesRoute, {
    prefix: '/v2/histories',
  });
  await app.register(disciplinasRoute, {
    prefix: '/v2/disciplinas',
  });
  await app.register(studentRoute, {
    prefix: '/v2/students',
  });
}

export async function nextRoutes(app: FastifyInstance) {
  // auth every route from here
  app.addHook('onRequest', authenticate);

  await app.register(userRoute, {
    prefix: '/users',
  });
  await app.register(enrollmentsRoute, {
    prefix: '/enrollments',
  });
  await app.register(commentsRoute, {
    prefix: '/comments',
  });
  await app.register(graduationsRoute, {
    prefix: '/graduation',
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
