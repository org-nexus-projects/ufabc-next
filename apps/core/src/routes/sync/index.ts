import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { syncEnrolledSchema } from '@/schemas/sync/enrolled.js';

import { syncEnrolledStudents } from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const connector = new UfabcParserConnector();

  app.put(
    '/enrolled',
    {
      schema: syncEnrolledSchema,
      preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request) =>
      syncEnrolledStudents(
        connector,
        request.body.operation,
        request.query.season,
        request.log
      )
  );
};

export default plugin;
