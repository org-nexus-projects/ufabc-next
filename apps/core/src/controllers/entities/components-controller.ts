import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { validateStudent } from '@/hooks/validate-student.js';
import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import {
  findTeachers,
  listKickedStudents,
  listLegacyComponents,
  updateGroupUrls,
} from '@/routes/entities/components/service.js';
import {
  listKickedSchema,
  listLegacyComponentsSchema,
  listTeacherComponents,
  updateGroupUrlsSchema,
} from '@/schemas/entities/components.js';

const tags = ['Components'];

const componentsRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await listLegacyComponents(request)),
    method: 'GET',
    schema: {
      querystring: listLegacyComponentsSchema.querystring,
      tags,
    },
    url: '/',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await listKickedStudents(request)),
    method: 'GET',
    preHandler: [validateStudent],
    schema: {
      params: listKickedSchema.params,
      querystring: listKickedSchema.querystring,
      response: {
        200: listKickedSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/:componentId/kicks',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { season, subject } = request.query;

      const components = await findTeachers(subject, season);

      return await reply.status(200).send(await components.map((c) => ({
        teoria: c.teoria?.name,
        pratica: c.pratica?.name,
      })));
    },
    method: 'GET',
    schema: {
      querystring: listTeacherComponents.querystring,
      response: {
        200: listTeacherComponents.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/teachers',
  });

  scoped.route({
    handler: async (request, reply) =>
      updateGroupUrls(request, reply, request.log),
    method: 'PATCH',
    schema: {
      body: updateGroupUrlsSchema.body,
      params: updateGroupUrlsSchema.params,
      querystring: updateGroupUrlsSchema.querystring,
      tags,
    },
    url: '/update-group-urls/:originKey',
  });
};

export const componentsEntitiesController: FastifyPluginAsyncZod = async (
  app
) => {
  await app.register(componentsRoutes, { prefix: '/entities/components' });
};
