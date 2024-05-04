import { HistoryModel } from '@/models/History.js';
import { GraduationModel } from '@/models/Graduation.js';
import { authenticate } from '@/hooks/authenticate.js';
import { normalizeCourseName } from '../utils/normalizeCourseName.js';
import { updateUserGraduation } from '../utils/updateUserGraduation.js';
import { HistoryRepository } from './history.repository.js';
import { HistoryService } from './history.service.js';
import { HistoryHandler } from './history.handlers.js';
import type { currentQuad } from '@next/common';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function historyRoutes(app: FastifyInstance) {
  const historyRepository = new HistoryRepository(
    HistoryModel,
    GraduationModel,
  );
  const historyService = new HistoryService(historyRepository);
  const historyHandler = new HistoryHandler(historyService);

  app.decorate('historyService', historyService);
  app.decorate('normalizeCourseName', normalizeCourseName);
  app.decorate('updateUserGraduation', updateUserGraduation);

  app.post('/', historyHandler.userHistory);
  app.get<{
    Querystring: { season: ReturnType<typeof currentQuad> };
  }>(
    '/courses',
    { onRequest: [authenticate] },
    historyHandler.historiesCourses,
  );
}
