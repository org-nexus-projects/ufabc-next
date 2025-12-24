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
      const courses = await moodleConnector.getComponents(
        session.sessionId,
        session.sessKey,
      );

      const componentArchives = await getComponentArchives(courses[0]);
      if (componentArchives.error || !componentArchives.data) {
        return reply.internalServerError(componentArchives.error ?? 'No data');
      }

      await app.manager.dispatch(JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING, {
        component: componentArchives.data,
        globalTraceId: request.id,
        session,
      });

      return reply.status(202).send({
        status: 'success',
      });
    },
  });

  app.route({
    method: 'GET',
    url: '/components/archives/pdfs',
    handler: async (request, reply) => {
      const pdfs = await app.aws.s3.list('bucket-files');
      return reply.status(200).send(pdfs.Contents);
    },
  });
};

export default componentsController;
