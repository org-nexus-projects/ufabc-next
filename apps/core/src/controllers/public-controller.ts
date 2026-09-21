import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import {
  buildComponentsStats,
  buildStudentStats,
  buildSummary,
  buildUsageStats,
  listPublicGraduations,
} from '@/routes/public/service.js';
import {
  listComponentsResume,
  listGraduationsSchema,
  listStudentStats,
  publicSummarySchema,
  publicUsageSchema,
} from '@/schemas/public.js';

const tags = ['Public'];

const publicRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  const publicCache = scoped.cache();

  scoped.route({
    handler: async (_request, reply) => {
      const cached = publicCache.get('summary');
      if (cached) {
        return await reply.status(200).send(cached);
      }

      const summary = await buildSummary();

      publicCache.set('usage', summary);

      return await reply.status(200).send(summary);
    },
    logLevel: 'silent',
    method: 'GET',
    schema: {
      querystring: publicSummarySchema.querystring,
      tags,
    },
    url: '/summary',
  });

  scoped.route({
    handler: async (_request, reply) =>
      await reply.status(200).send(await listPublicGraduations()),
    logLevel: 'silent',
    method: 'GET',
    schema: {
      response: {
        200: listGraduationsSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/graduations',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await buildStudentStats(request.query.season)),
    logLevel: 'silent',
    method: 'GET',
    schema: {
      querystring: listStudentStats.querystring,
      response: {
        200: listStudentStats.response[200].content['application/json'].schema,
      },
      tags,
    },
    url: '/stats/student',
  });

  scoped.route({
    handler: async (_request, reply) =>
      await reply.status(200).send(await buildUsageStats()),
    logLevel: 'silent',
    method: 'GET',
    schema: {
      querystring: publicUsageSchema.querystring,
      tags,
    },
    url: '/stats/usage',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await buildComponentsStats(request.params.action, request.query)),
    logLevel: 'silent',
    method: 'GET',
    schema: {
      params: listComponentsResume.params,
      querystring: listComponentsResume.querystring,
      response: {
        200: listComponentsResume.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/stats/components/:action?',
  });
};

export const publicController: FastifyPluginAsyncZod = async (app) => {
  await app.register(publicRoutes, { prefix: '/public' });
};
