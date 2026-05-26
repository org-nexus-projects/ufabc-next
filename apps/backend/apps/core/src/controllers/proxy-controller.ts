import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { CommunicationsConnector } from '@/connectors/communications.js';

const announcementBodySchema = z.object({
  courseIdentifier: z.number().int(),
  season: z.string().min(1),
  text: z.string().min(1),
});

const announcementResponseSchema = z.object({
  message: z.string(),
});

const errorResponseSchema = z.object({
  message: z.string(),
});

export const proxyController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/announcement',
    schema: {
      body: announcementBodySchema,
      response: {
        202: announcementResponseSchema,
        502: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const communications = new CommunicationsConnector(
        app.config.COMMUNICATIONS_API_URL,
        request.id
      );

      try {
        const response = await communications.sendAnnouncement(request.body);

        return reply.status(202).send(response);
      } catch (error) {
        request.log.error(
          {
            error,
            target: 'communications',
          },
          'Failed to proxy announcement request'
        );

        return reply.status(502).send({
          message: 'Failed to send announcement',
        });
      }
    },
  });
};
