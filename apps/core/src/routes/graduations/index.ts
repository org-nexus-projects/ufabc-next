import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import {
  listGraduationsSubjectsByIdSchema,
  listGraduationsSubjectsSchema,
} from '@/schemas/graduations.js';

import {
  listGraduationSubjectsById,
  listGraduationSubjectsPage,
} from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get(
    '/subjects',
    {
      schema: listGraduationsSubjectsSchema,
      preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request) => {
      const { limit, page } = request.query;

      return await listGraduationSubjectsPage(page, limit);
    }
  );

  app.get(
    '/subjects/:graduationId',
    {
      schema: listGraduationsSubjectsByIdSchema,
      preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request) => {
      const { graduationId } = request.params;
      const limit = request.query.limit;
      return await listGraduationSubjectsById(graduationId, limit);
    }
  );
};

export default plugin;
