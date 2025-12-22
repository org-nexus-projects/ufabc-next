import { moodleSession } from '@/hooks/moodle-session.js';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

const componentsController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/components/archives',
    preHandler: [moodleSession],
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
      headers: z.object({
        'session-id': z.string(),
        'sess-key': z.string(),
      }),
    },
    handler: async (request) => {
      const { page } = request.query;
      return { message: 'Components archives controller' };
    },
  });
};

export default componentsController;
