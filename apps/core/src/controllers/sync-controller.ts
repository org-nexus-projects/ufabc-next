import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { legacyJwtHook } from '@/hooks/legacy-auth.js';
import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import { syncEnrolledStudents } from '@/routes/sync/service.js';
import { syncEnrolledSchema } from '@/schemas/sync/enrolled.js';

const syncRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  const connector = new UfabcParserConnector();

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await syncEnrolledStudents(
        connector,
        request.body.operation,
        request.query.season,
        request.log
      )),
    method: 'PUT',
    onRequest: legacyJwtHook,
    preHandler: (request, reply) => request.isAdmin(reply),
    schema: {
      body: syncEnrolledSchema.body,
      querystring: syncEnrolledSchema.querystring,
      response: {
        200: syncEnrolledSchema.response[200].content['application/json']
          .schema,
      },
      tags: ['Sync'],
    },
    url: '/enrolled',
  });
};

export const syncController: FastifyPluginAsyncZod = async (app) => {
  await app.register(syncRoutes, { prefix: '/sync' });
};
