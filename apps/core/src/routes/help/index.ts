import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { submitHelpForm } from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/form',
    {
      schema: {
        tags: ['help'],
        consumes: ['multipart/form-data'],
      },
    },
    async (request, reply) => {
      const result = await submitHelpForm(request, app.job, request.log);

      return reply.code(result.statusCode).send(result.body);
    }
  );
};

export default plugin;
