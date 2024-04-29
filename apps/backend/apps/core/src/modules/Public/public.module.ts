import { statusRoute } from './status/route.js';
import { summaryRoute } from './summary/route.js';
import { statsGeneralRoute } from './stats/general/general.route.js'
import type { FastifyInstance } from 'fastify';

export async function publicModule(app: FastifyInstance) {
  await app.register(summaryRoute, {
    prefix: '/public',
  });
  await app.register(statusRoute, {
    prefix: '/public',
  });
  await app.register(statsGeneralRoute, {
    prefix: '/public'
  })
}
