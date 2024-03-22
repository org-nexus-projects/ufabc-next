import { HistoryModel } from '@/models/History.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { CourseStatsRepository } from './courseStats.repository.js';
import { CourseStatsService } from './courseStats.service.js';
import { CourseStatsHandlers } from './courseStats.handlers.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function courseStatsRoute(app: FastifyInstance) {
  const courseStatsRepository = new CourseStatsRepository(
    HistoryModel,
    GraduationHistoryModel,
  );
  const courseStatsService = new CourseStatsService(courseStatsRepository);
  app.decorate('courseStatsService', courseStatsService);
  const courseStatsHandler = new CourseStatsHandlers(courseStatsService);

  app.get('/grades', courseStatsHandler.gradesStats);
  app.get('/history', courseStatsHandler.graduationHistory);
}
