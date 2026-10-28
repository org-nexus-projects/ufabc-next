import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { ARCHIVE_READERS } from '@/constants.js';
import { permissionVerifyHook } from '@/hooks/permission-verify.js';
import {
  archiveDownloadResponseSchema,
  archiveListQuerySchema,
  archiveListResponseSchema,
  archiveParamsSchema,
  componentPlanResponseSchema,
  planParamsSchema,
} from '@/schemas/v2/archives.js';
import { ArchiveMonitoringService } from '@/services/archive-monitoring-service.js';

export const archivesController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    handler: async (request, reply) => {
      const filter = request.query;
      const archiveMonitoringService = new ArchiveMonitoringService({
        bucket: app.config.AWS_BUCKET,
        globalTraceId: request.id,
        storageConnector: app.aws.s3,
      });
      const archives = await archiveMonitoringService.listArchives(filter);

      return await reply.status(200).send(archives);
    },
    method: 'GET',
    preHandler: [permissionVerifyHook(ARCHIVE_READERS)],
    schema: {
      querystring: archiveListQuerySchema,
      response: { 200: archiveListResponseSchema },
    },
    url: '/archives',
  });

  app.route({
    handler: async (request, reply) => {
      const { archiveId } = request.params;
      const archiveMonitoringService = new ArchiveMonitoringService({
        bucket: app.config.AWS_BUCKET,
        globalTraceId: request.id,
        storageConnector: app.aws.s3,
      });
      const download =
        await archiveMonitoringService.createDownloadUrl(archiveId);

      return await reply.status(200).send(download);
    },
    method: 'GET',
    preHandler: [permissionVerifyHook(ARCHIVE_READERS)],
    schema: {
      params: archiveParamsSchema,
      response: { 200: archiveDownloadResponseSchema },
    },
    url: '/archives/:archiveId/download',
  });

  app.route({
    handler: async (request, reply) => {
      const { componentId } = request.params;
      const archiveMonitoringService = new ArchiveMonitoringService({
        bucket: app.config.AWS_BUCKET,
        globalTraceId: request.id,
        storageConnector: app.aws.s3,
      });
      const plan = await archiveMonitoringService.findLatestPlan(componentId);

      return await reply.status(200).send(plan);
    },
    method: 'GET',
    preHandler: [permissionVerifyHook(ARCHIVE_READERS)],
    schema: {
      params: planParamsSchema,
      response: { 200: componentPlanResponseSchema },
    },
    url: '/components/:componentId/plan',
  });
};
