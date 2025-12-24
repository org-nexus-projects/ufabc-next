import { MoodleConnector } from '@/connectors/moodle.js';
import { moodleSession } from '@/hooks/moodle-session.js';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { getComponentArchives } from '@/services/components-service.js';
import { JOB_NAMES } from '@/constants.js';
import LRUWeakCache from 'lru-weak-cache';

const moodleConnector = new MoodleConnector();

const cache = new LRUWeakCache<{
  session: { sessionId: string; sessKey: string };
}>({
  capacity: 10,
  maxAge: 1000 * 60 * 60 * 24, // 24 Hours,
});

const componentsController: FastifyPluginAsyncZod = async (app) => {
  app.decorate('cacheV2', cache);

  app.route({
    method: 'POST',
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
      const cache =
        app.getDecorator<
          LRUWeakCache<{ session: { sessionId: string; sessKey: string } }>
        >('cacheV2');
      const session = request.requestContext.get('moodleSession')!;
      const cachedSession = cache.get('session');
      if (cachedSession) {
        return reply.status(202).send({
          status: 'success',
        });
      }
      const courses = await moodleConnector.getComponents(
        session.sessionId,
        session.sessKey,
      );

      const componentArchives = await getComponentArchives(courses[0]);
      if (componentArchives.error || !componentArchives.data) {
        return reply.internalServerError(componentArchives.error ?? 'No data');
      }

      // await app.manager.dispatch(JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING, {
      //   component: componentArchives.data,
      //   globalTraceId: request.id,
      //   session,
      // });

      cache.set('session', {
        session,
      });
      return reply.status(202).send({
        status: 'success',
      });
    },
  });
};

export default componentsController;
