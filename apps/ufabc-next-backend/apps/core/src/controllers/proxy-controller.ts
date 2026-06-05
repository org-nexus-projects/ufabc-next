import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { CommunicationsConnector } from '@/connectors/communications.js';
import { permissionVerifyHook } from '@/hooks/permission-verify.js';
import { ALLOWED_ANNOUNCEMENT_PERMISSIONS } from '@/constants.js';

export const proxyController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/announcement',
    schema: {
      body: z.object({
        courseIdentifier: z.number().int(),
        season: z.string().min(1),
        message: z.string().min(1),
      }),
      response: {
        202: z.object({ message: z.string() }),
        502: z.object({ message: z.string() }),
      },
    },
    preHandler: [permissionVerifyHook(ALLOWED_ANNOUNCEMENT_PERMISSIONS)],
    handler: async (request, reply) => {
      const communications = new CommunicationsConnector(
        app.config.COMMUNICATIONS_API_URL,
        request.id
      );
      const response = await communications.sendAnnouncement(request.body);

      return reply.status(202).send(response);
    },
  });
};
