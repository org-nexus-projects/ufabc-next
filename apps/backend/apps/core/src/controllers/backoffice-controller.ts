import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { adminHook } from '@/hooks/admin.js';

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

  app.route({
    method: 'DELETE',
    url: '/backoffice/redis/key',
    schema: {
      response: {
        200: z.object({
          message: z.string(),
        }),
      },
      querystring: z.object({
        key: z.string().min(1),
      }),
    },
    // preHandler: [adminHook],
    handler: async (request, reply) => {
      const { key } = request.query;
      await app.redis.del(key);
      return reply.status(200).send({ message: 'Key deleted' });
    },
  });
};

export default backofficeController;
