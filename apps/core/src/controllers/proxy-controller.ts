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
        429: z.object({ message: z.string() }),
      },
    },
    preHandler: [permissionVerifyHook(ALLOWED_ANNOUNCEMENT_PERMISSIONS)],
    onError: async (request, _, error) => {
      const lockKey = `announcement:${request.user._id}`;
      await request.releaseLock(lockKey);
      request.log.error(
        { error, userId: request.user._id },
        'Failed to send announcement'
      );
    },
    handler: async (request, reply) => {
      const lockKey = `announcement:${request.user._id}`;
      const hasLock = await request.acquireLock(lockKey, '24h');

      if (!hasLock) {
        return reply.status(429).send({
          message: 'You can only send one announcement per day',
        });
      }

      const communications = new CommunicationsConnector(
        app.config.COMMUNICATIONS_API_URL,
        request.id
      );
      const response = await communications.sendAnnouncement(request.body);

      return reply.status(202).send(response);
    },
  });
};
