import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { sigaaSession } from '@/hooks/sigaa-session.js';

const CACHE_TTL = 1000 * 60 * 60 * 24; // 1 day

export const studentsController: FastifyPluginAsyncZod = async (app) => {
  const connector = new UfabcParserConnector();

  app.route({
    method: 'POST',
    url: '/students/sigaa',
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
        202: z.object({
          status: z.string(),
        }),
      },
    },
    preHandler: [sigaaSession],
    onSend: async (request, _reply, _payload) => {
      const { ra, login } = request.body;
      const { db } = request.server;
      await db.StudentSync.create({
        ra: String(ra),
        status: 'created',
        timeline: [
          {
            status: 'created',
            metadata: {
              login,
            },
          },
        ],
      });
    },
    handler: async (request, reply) => {
      const { ra, login } = request.body;
      const { sessionId, viewId } = request.sigaaSession;
      const cacheKey = `students:sigaa:${ra}`;

      const cached = await app.redis.get(cacheKey);
      if (cached) {
        app.log.debug({ cacheKey }, 'Student already synced');
        return reply.status(202).send({
          status: 'success',
        });
      }

      await connector.syncStudent({
        sessionId,
        viewId,
        requesterKey: app.config.UFABC_PARSER_REQUESTER_KEY,
      });

      const studentSync = await app.db.StudentSync.findOne({ ra: String(ra) });
      if (!studentSync) {
        return reply.forbidden();
      }

      await studentSync.transition('awaiting', {
        source: 'sigaa',
        metadata: {
          login,
        },
      });
      await app.redis.set(cacheKey, login, 'PX', CACHE_TTL);

      return reply.status(202).send({
        status: 'success',
      });
    },
  });
};

export default studentsController;
