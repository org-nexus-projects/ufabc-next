import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { validateStudent } from '@/hooks/validate-student.js';
import {
  listKickedSchema,
  listTeacherComponents,
} from '@/schemas/entities/components.js';

import {
  findTeachers,
  listKickedStudents,
  listLegacyComponents,
  updateGroupUrls,
} from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/', async (request, reply) => listLegacyComponents(request));

  app.get(
    '/:componentId/kicks',
    { preHandler: [validateStudent], schema: listKickedSchema },
    async (request, _reply) => listKickedStudents(request)
  );

  app.get(
    '/teachers',
    { schema: listTeacherComponents },
    async (request, reply) => {
      const { season, subject } = request.query;

      const components = await findTeachers(subject, season);

      return components.map((c) => ({
        teoria: c.teoria?.name,
        pratica: c.pratica?.name,
      }));
    }
  );

  app.patch('/update-group-urls/:originKey', async (request, reply) =>
    updateGroupUrls(request, reply, request.log)
  );
};

export default plugin;
