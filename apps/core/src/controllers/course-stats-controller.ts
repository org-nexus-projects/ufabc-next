import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { legacyJwtHook } from '@/hooks/legacy-auth.js';
import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import {
  buildCrDistribution,
  buildUserHistory,
  listUserGraduationHistories,
} from '@/routes/courseStats/service.js';
import {
  gradesStatsSchema,
  listUserGradesSchema,
  userGradesSchema,
} from '@/schemas/courseStats.js';

const tags = ['CourseStats'];

const courseStatsRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  scoped.route({
    handler: async (_request, reply) =>
      await reply.status(200).send(await buildCrDistribution()),
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      response: {
        200: gradesStatsSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/grades',
  });

  scoped.route({
    handler: async ({ user }, reply) =>
      await reply.status(200).send(await buildUserHistory(user.ra)),
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      response: {
        200: userGradesSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/history',
  });

  scoped.route({
    handler: async ({ user }, reply) =>
      await reply.status(200).send(await listUserGraduationHistories(user.ra)),
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      querystring: listUserGradesSchema.querystring,
      tags,
    },
    url: '/user/grades',
  });
};

export const courseStatsController: FastifyPluginAsyncZod = async (app) => {
  await app.register(courseStatsRoutes, { prefix: '/courseStats' });
};
