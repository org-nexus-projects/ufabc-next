import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import {
  listGraduationsSubjectsByIdSchema,
  listGraduationsSubjectsSchema,
} from '@/schemas/graduations.js';

import { getPaginated, getTotal, listSubjectsById } from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get(
    '/subjects',
    {
      schema: listGraduationsSubjectsSchema,
      preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request, reply) => {
      const { limit, page } = request.query;

      const [total, graduationSubjects] = await Promise.all([
        getTotal(),
        getPaginated(page, limit),
      ]);

      const pages = Math.ceil(total / limit);
      const results = graduationSubjects.map((g) => ({
        _id: g._id.toString(),
        name: g.subject.name,
        UFCode: g.codigo,
        credits: g.creditos,
        category: g.category,
        year: g.year,
        quad: g.quad,
      }));

      return {
        total,
        pages,
        data: results,
      };
    }
  );

  app.get(
    '/subjects/:graduationId',
    {
      schema: listGraduationsSubjectsByIdSchema,
      preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request, reply) => {
      const { graduationId } = request.params;
      const limit = request.query.limit;
      const graduationSubjects = await listSubjectsById(graduationId, limit);
      return { docs: graduationSubjects };
    }
  );
};

export default plugin;
