import { adminHook } from '@/hooks/admin.js';
import { HTTP_REDIS_KEY_PREFIX } from '@/constants.js';
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
    },
    preHandler: [adminHook],
    handler: async (request, reply) => {
      const httpKeys = await app.redis.keys(`${HTTP_REDIS_KEY_PREFIX}:*`);
      return reply.status(200).send({ keys: httpKeys });
    },
  });
};

export default backofficeController;
