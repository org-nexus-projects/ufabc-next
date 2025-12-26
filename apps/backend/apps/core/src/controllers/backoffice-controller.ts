import { adminHook } from '@/hooks/admin.js';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

const backofficeController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/backoffice/redis/keys',
    schema: {
      response: {
        200: z.object({
          keys: z.string().array(),
        }),
      },
      querystring: z.object({
        namespace: z.enum(['http', 'bull']).optional().default('http'),
      }),
    },
    preHandler: [adminHook],
    handler: async (request, reply) => {
      const { namespace } = request.query;
      const keys = await app.redis.keys(`${namespace}:*`);
      return reply.status(200).send({ keys });
    },
  });
};

export default backofficeController;
