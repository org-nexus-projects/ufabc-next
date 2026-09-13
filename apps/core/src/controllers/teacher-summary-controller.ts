import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { jwtVerifyHook } from '@/hooks/jwt-verify.js';
import {
  teacherSummaryParamsSchema,
  teacherSummaryResponseSchema,
} from '@/schemas/v2/teacher-summary.js';
import { TeacherSummaryService } from '@/services/teacher-summary-service.js';

export const teacherSummaryController: FastifyPluginAsyncZod = async (
  app
) => {
  const summaryCache = app.cache<
    NonNullable<
      Awaited<ReturnType<TeacherSummaryService['findLatest']>>
    >
  >();

  app.route({
    method: 'GET',
    url: '/entities/teachers/summary/:teacherId',
    preHandler: [jwtVerifyHook],
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

      const teacherSummaryService = new TeacherSummaryService();
      const summary = await teacherSummaryService.findLatest(teacherId);

      if (!summary) {
        return reply.notFound('Nenhum resumo disponível para esse professor');
      }

      summaryCache.set(cacheKey, summary);
      return summary;
    },
  });
};
