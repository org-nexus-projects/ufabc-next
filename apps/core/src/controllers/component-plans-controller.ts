import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { ARCHIVE_READERS } from '@/constants.js';
import { permissionVerifyHook } from '@/hooks/permission-verify.js';
import {
  componentPlanResponseSchema,
  planParamsSchema,
} from '@/schemas/v2/component-plans.js';
import { ComponentPlansService } from '@/services/component-plans-service.js';

export const componentPlansController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    handler: async (request, reply) => {
      const { componentId } = request.params;
      const componentPlansService = new ComponentPlansService({
        globalTraceId: request.id,
      });
      const plan = await componentPlansService.findLatestPlan(componentId);

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
