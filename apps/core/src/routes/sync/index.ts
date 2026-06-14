import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { UfabcParserConnector } from '@next/connectors/ufabc-parser';
import { ComponentModel } from '@/models/Component.js';
import { syncEnrolledSchema } from '@/schemas/sync/enrolled.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.put(
    '/enrolled',
    {
      schema: syncEnrolledSchema,
      preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request) => {
      const { operation } = request.body;
      const { season } = request.query;

      const enrolledStudents = await new UfabcParserConnector({
        baseURL: app.config.UFABC_PARSER_URL,
        requesterKey: app.config.UFABC_PARSER_REQUESTER_KEY,
        globalTraceId: request.id,
      }).getEnrolled();

      const start = Date.now();

      const enrolledOperationsPromises = Object.entries(enrolledStudents).map(
        async ([componentId, students]) => {
          try {
            await ComponentModel.findOneAndUpdate(
              {
                disciplina_id: Number(componentId),
                season,
              },
              {
                $set: {
                  [operation]: students,
                },
              },
              { upsert: true, new: true }
            );
          } catch (error) {
            request.log.error({
              error: error instanceof Error ? error.message : String(error),
              students,
              msg: 'Failed to process Enrolled processing job',
            });
          }
        }
      );

      const processed = await Promise.all(enrolledOperationsPromises);

      return {
        status: 'ok',
        time: Date.now() - start,
        componentsProcessed: processed.length,
      };
    }
  );
};

export default plugin;
