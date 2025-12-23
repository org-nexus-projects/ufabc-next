import { MoodleConnector } from '@/connectors/moodle.js';
import { moodleSession } from '@/hooks/moodle-session.js';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { getComponentArchives } from '@/services/components-service.js';

const moodleConnector = new MoodleConnector();

const componentsController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/components/archives',
    preHandler: [moodleSession],
    schema: {
      response: {
        202: z.object({
          status: z.string(),
        }),
      },
      headers: z.object({
        'session-id': z.string(),
        'sess-key': z.string(),
      }),
    },
    handler: async (request, reply) => {
      const session = request.requestContext.get('moodleSession')!;
      const courses = await moodleConnector.getComponents(
        session.sessionId,
        session.sessKey,
      );

      const componentArchives = await getComponentArchives(courses[0]);
      if (componentArchives.error) {
        return reply.internalServerError(componentArchives.error);
      }

      // Dispatch test job with globalTraceId from requestContext
      const globalTraceId = request.requestContext.get('traceId') ?? request.id;
      await app.manager.dispatch('test_job', {
        message: 'hi its working!',
        globalTraceId,
      });

      return reply.status(202).send({
        status: 'success',
      });
    },
  });
};

export default componentsController;
