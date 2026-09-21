import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { gradesStatsSchema, userGradesSchema } from '@/schemas/courseStats.js';

import {
  buildCrDistribution,
  buildUserHistory,
  listUserGraduationHistories,
} from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/grades', { schema: gradesStatsSchema }, async () =>
    buildCrDistribution()
  );

  app.get('/history', { schema: userGradesSchema }, async ({ user }) =>
    buildUserHistory(user.ra)
  );

  app.get('/user/grades', async ({ user }) =>
    listUserGraduationHistories(user.ra)
  );
};

export default plugin;
