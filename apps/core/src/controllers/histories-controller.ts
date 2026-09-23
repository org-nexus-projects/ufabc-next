import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { legacyExtensionHook } from '@/hooks/legacy-auth.js';
import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import { listCurrentSeasonCourses } from '@/routes/histories/service.js';
import { listCurrentSeasonCoursesSchema } from '@/schemas/histories.js';

const tags = ['Histories'];

const historiesRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  scoped.route({
    handler: async (_request, reply) =>
      await reply.status(200).send(await listCurrentSeasonCourses()),
    method: 'GET',
    onRequest: legacyExtensionHook,
    schema: {
      querystring: listCurrentSeasonCoursesSchema.querystring,
      tags,
    },
    url: '/courses',
  });
};

export const historiesController: FastifyPluginAsyncZod = async (app) => {
  await app.register(historiesRoutes, { prefix: '/histories' });
};
