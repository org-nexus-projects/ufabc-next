import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import { submitHelpForm } from '@/routes/help/service.js';

const helpRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  scoped.route({
    handler: async (request, reply) => {
      const result = await submitHelpForm(request, scoped.job, request.log);

      return await reply.code(result.statusCode).send(result.body);
    },
    method: 'POST',
    schema: {
      consumes: ['multipart/form-data'],
      tags: ['help'],
    },
    url: '/form',
  });
};

export const helpController: FastifyPluginAsyncZod = async (app) => {
  await app.register(helpRoutes, { prefix: '/help' });
};
