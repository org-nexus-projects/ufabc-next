import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const webhookController: FastifyPluginAsyncZod = async (app) => {

  app.route({
    method: 'POST',
    url: '/webhook',
    handler: async (request, reply) => {
      return reply.status(200).send({ message: 'OK' });
    },
  });
};
