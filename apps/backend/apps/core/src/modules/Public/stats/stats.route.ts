import type { FastifyInstance } from 'fastify';
import {
  componentStatsSchema,
  generalStatsSchema,
  studentStatsSchema,
} from './stats.schema.js';
import { studentStats } from './handlers/students.js';
import { generalStats } from './handlers/general.js';
import { componentStats } from './handlers/components.js';

export async function publicStatsRoute(app: FastifyInstance) {
  app.get('/stats/student', { schema: studentStatsSchema }, studentStats);
  app.get('/stats/usage', { schema: generalStatsSchema }, generalStats);
  app.get(
    '/stats/disciplinas/:action',
    { schema: componentStatsSchema },
    componentStats,
  );
}
