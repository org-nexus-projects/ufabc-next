import { HistoryModel } from '@/models/History.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { GraduationModel } from '@/models/Graduation.js';
import { authenticate } from '@/hooks/authenticate.js';
import { CourseStatsRepository } from './courseStats.repository.js';
import { CourseStatsService } from './courseStats.service.js';
import { CourseStatsHandlers } from './courseStats.handlers.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function courseStatsRoute(app: FastifyInstance) {
  const courseStatsRepository = new CourseStatsRepository(
    HistoryModel,
    GraduationHistoryModel,
    GraduationModel,
  );
  const courseStatsService = new CourseStatsService(courseStatsRepository);
  app.decorate('courseStatsService', courseStatsService);
  const courseStatsHandler = new CourseStatsHandlers(courseStatsService);

  app.get(
    '/grades',
    { onRequest: [authenticate] },
    courseStatsHandler.gradesStats,
  );
  app.get<{ Querystring: { ra: number } }>(
    '/history',
    { onRequest: [authenticate] },
    courseStatsHandler.graduationHistory,
  );
  app.get(
    '/user/grades',
    { onRequest: [authenticate] },
    courseStatsHandler.userGraduationStats,
  );
}
