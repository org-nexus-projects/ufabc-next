import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { findLatestSummary } from '@/routes/entities/teachers/service.js';
import {
  teacherSummaryParamsSchema,
  teacherSummaryResponseSchema,
} from '@/schemas/v2/teacher-summary.js';

export const teacherSummaryController: FastifyPluginAsyncZod = async (
  app
) => {
  const summaryCache = app.cache<
    NonNullable<Awaited<ReturnType<typeof findLatestSummary>>>
  >();

  app.route({
    method: 'GET',
    url: '/entities/teachers/summary/:teacherId',
    // Public endpoint — no preHandler. This route sits outside `routes/`
    // (autohooks.ts global auth hook), so auth is opt-in per route here.
    schema: {
      params: teacherSummaryParamsSchema,
      response: {
        200: teacherSummaryResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { teacherId } = request.params;

      const cacheKey = `summary:${teacherId}`;
      const cached = summaryCache.get(cacheKey);
      if (cached) return cached;

      const summary = await findLatestSummary(teacherId);

      if (!summary) {
        return reply.notFound('Nenhum resumo disponível para esse professor');
      }

      summaryCache.set(cacheKey, summary);
      return summary;
    },
  });
};
