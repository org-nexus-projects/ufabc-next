import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { sigaaSession } from '@/hooks/sigaa-session.js';
import { z } from 'zod';
import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import type { onSendAsyncHookHandler } from 'fastify';

const CACHE_TTL = 1000 * 60 * 60 * 24; // 1 day

const onSendStudentSync: onSendAsyncHookHandler<{ ra: string; login: string }> = async (request, reply, body) => {
  const { ra, login } = body;
  const { db } = request.server
  await db.StudentSync.create({
    ra,
    status: 'created',
    timeline: [{
      status: 'created',
      metadata: {
        login,
      }
    }]
  })
}

export const studentsController: FastifyPluginAsyncZod = async (app) => {
  const connector = new UfabcParserConnector();

  app.route({
    method: 'POST',
    url: '/students/sigaa',
    preHandler: [sigaaSession],
    onSend: [onSendStudentSync],
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
      const { sessionId, viewId } = request.sigaaSession;
      const cacheKey = `students:sigaa:${ra}`;

      const cached = await app.redis.get(cacheKey);
      if (cached) {
        app.log.debug({ cacheKey }, 'Student already synced');
        return reply.status(200).send({
          status: 'success',
        });
      }

      await connector.syncStudent({
        sessionId,
        viewId,
        requesterKey: app.config.UFABC_PARSER_REQUESTER_KEY,
      });
      await app.redis.set(cacheKey, login, 'PX', CACHE_TTL);

      return reply.status(200).send({
        status: 'success',
      });
    },
  });
};

export default studentsController;
