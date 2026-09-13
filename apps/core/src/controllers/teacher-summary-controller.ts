import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { TeacherSummaryNotFound } from '@/errors/custom-errors.js';
import { jwtVerifyHook } from '@/hooks/jwt-verify.js';
import {
  teacherSummaryParamsSchema,
  teacherSummaryResponseSchema,
} from '@/schemas/v2/teacher-summary.js';
import type { LatestSummary } from '@/services/teacher-summary-service.js';
import { TeacherSummaryService } from '@/services/teacher-summary-service.js';

export const teacherSummaryController: FastifyPluginAsyncZod = async (app) => {
  const summaryCache = app.cache<LatestSummary>();

  app.route({
    handler: async (request) => {
      const { teacherId } = request.params;

      const cacheKey = `summary:${teacherId}`;
      const cached = summaryCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const teacherSummaryService = new TeacherSummaryService();
      const summary = await teacherSummaryService.findLatest(teacherId);

      if (!summary) {
        throw new TeacherSummaryNotFound(teacherId);
      }

      summaryCache.set(cacheKey, summary);
      return summary;
    },
    method: 'GET',
    preHandler: [jwtVerifyHook],
    schema: {
      params: teacherSummaryParamsSchema,
      response: {
        200: teacherSummaryResponseSchema,
      },
    },
    url: '/teachers/:teacherId/summary',
  });
};
