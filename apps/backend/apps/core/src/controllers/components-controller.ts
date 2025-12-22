import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

const componentsController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/components/archives',
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().optional(),
      }),
      response: {
        200: z.object({
          message: z.string(),
          page: z.number().optional(),
        }),
      },
    },
    handler: async (request) => {
      const { page } = request.query;
      return { message: 'Components archives controller' };
    },
  });
};

export default componentsController;
