import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { legacyAdminHook, legacyJwtHook } from '@/hooks/legacy-auth.js';
import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import {
  listGraduationSubjectsById,
  listGraduationSubjectsPage,
} from '@/routes/graduations/service.js';
import {
  listGraduationsSubjectsByIdSchema,
  listGraduationsSubjectsSchema,
} from '@/schemas/graduations.js';

const tags = ['graduations'];

const graduationsRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  scoped.route({
    handler: async (request, reply) => {
      const { limit, page } = request.query;

      return await reply.status(200).send(await listGraduationSubjectsPage(page, limit));
    },
    method: 'GET',
    onRequest: legacyJwtHook,
    preHandler: [legacyAdminHook],
    schema: {
      querystring: listGraduationsSubjectsSchema.querystring,
      response: {
        200: listGraduationsSubjectsSchema.response[200].content[
          'application/json'
        ].schema,
      },
      tags,
    },
    url: '/subjects',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { graduationId } = request.params;
      const limit = request.query.limit;
      return await reply.status(200).send(await listGraduationSubjectsById(graduationId, limit));
    },
    method: 'GET',
    onRequest: legacyJwtHook,
    preHandler: [legacyAdminHook],
    schema: {
      params: listGraduationsSubjectsByIdSchema.params,
      querystring: listGraduationsSubjectsByIdSchema.querystring,
      response: {
        200: listGraduationsSubjectsByIdSchema.response[200].content[
          'application/json'
        ].schema,
      },
      tags,
    },
    url: '/subjects/:graduationId',
  });
};

export const graduationsController: FastifyPluginAsyncZod = async (app) => {
  await app.register(graduationsRoutes, { prefix: '/graduations' });
};
