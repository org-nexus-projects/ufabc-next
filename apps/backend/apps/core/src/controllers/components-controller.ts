import { MoodleConnector } from '@/connectors/moodle.js';
import { moodleSession } from '@/hooks/moodle-session.js';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { getComponentArchives } from '@/services/components-service.js';
import { JOB_NAMES } from '@/constants.js';

const moodleConnector = new MoodleConnector();

const componentsController: FastifyPluginAsyncZod = async (app) => {
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
      const session = request.requestContext.get('moodleSession')!;
      const hasLock = await request.acquireLock(session.sessionId, '24h');

      if (!hasLock) {
        request.log.debug(
          { sessionId: session.sessionId },
          'Archives already processing'
        );
        return reply.status(202).send({ status: 'success' });
      }

      try {
        const courses = await moodleConnector.getComponents(
          session.sessionId,
          session.sessKey
        );

        const componentArchives = await getComponentArchives(courses[0]);
        if (componentArchives.error || !componentArchives.data) {
          await request.releaseLock(session.sessionId);
          return reply.badRequest(componentArchives.error ?? 'No data');
        }

        await app.manager.dispatch(JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING, {
          component: componentArchives.data,
          globalTraceId: request.id,
          session,
        });

        return reply.status(202).send({
          status: 'success',
        });
      } catch (error) {
        request.log.error(error, 'Error getting archives');
        await request.releaseLock(session.sessionId);
        return reply.internalServerError('Error getting archives');
      }
    },
  });

  app.route({
    method: 'GET',
    url: '/components/archives',
    preHandler: [moodleSession],
    schema: {
      response: {
        200: z.object({
          status: z.string(),
          data: z.any().array(),
        }),
      },
    },
    handler: async (request, reply) => {
      const session = request.requestContext.get('moodleSession')!;
      const components = await moodleConnector.getComponents(
        session.sessionId,
        session.sessKey
      );
      return reply.status(200).send({
        status: 'success',
        data: components,
      });
    },
  });

  app.route({
    method: 'GET',
    url: '/components/archives/uploads',
    handler: async (request, reply) => {
      const uploads = await app.aws.s3.list(app.config.AWS_BUCKET);
      return reply.status(200).send({
        status: 'success',
        data: uploads,
      });
    },
  });
};

export default componentsController;
