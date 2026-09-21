import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import {
  listComponentsResume,
  listGraduationsSchema,
  listStudentStats,
} from '@/schemas/public.js';

import {
  buildComponentsStats,
  buildStudentStats,
  buildSummary,
  buildUsageStats,
  listPublicGraduations,
} from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const publicCache = app.cache();

  app.get('/summary', { logLevel: 'silent' }, async () => {
    const cached = publicCache.get('summary');
    if (cached) {
      return cached;
    }

    const summary = await buildSummary();

    publicCache.set('usage', summary);

    return summary;
  });

  app.get(
    '/graduations',
    { schema: listGraduationsSchema, logLevel: 'silent' },
    async () => listPublicGraduations()
  );

  app.get(
    '/stats/student',
    { schema: listStudentStats, logLevel: 'silent' },
    async (request) => buildStudentStats(request.query.season)
  );

  app.get('/stats/usage', { logLevel: 'silent' }, async () =>
    buildUsageStats()
  );

  app.get(
    '/stats/components/:action?',
    { logLevel: 'silent', schema: listComponentsResume },
    async (request) =>
      buildComponentsStats(request.params.action, request.query)
  );
};

export default plugin;
