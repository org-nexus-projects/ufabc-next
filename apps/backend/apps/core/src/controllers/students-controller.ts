import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { sigaaSession } from '@/hooks/sigaa-session.js';
import { z } from 'zod';
import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';

const CACHE_TTL = 1 * 60 * 60 * 24; // 1 day

export const studentsController: FastifyPluginAsyncZod = async (app) => {
  const connector = new UfabcParserConnector();
  
  app.route({
    method: 'POST',
    url: '/students/sigaa',
    preHandler: [sigaaSession],
    schema: {
      headers: z.object({
        'session-id': z.string(),
        'view-id': z.string(),
      }),
      body: z.object({
        ra: z.number(),
        login: z.string(),
      }),
      response: {
        200: z.object({
          status: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { ra, login } = request.body;
      const cached  = await app.redis.get(`students:sigaa:${ra}`);
      if (cached) {
        return reply.status(200).send({
          status: 'success',
        });
      }

      await connector.syncStudent({
        sessionId: request.headers['session-id'],
        viewId: request.headers['view-id'],
        requesterKey: app.config.UFABC_PARSER_REQUESTER_KEY,
      });
      await app.redis.set(`students:sigaa:${ra}`, login, 'PX', CACHE_TTL);
  
      return reply.status(200).send({
        status: 'success',
      });
    },
  })
  
};

export default studentsController;
