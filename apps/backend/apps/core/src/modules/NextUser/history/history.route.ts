import { authenticate } from '@/hooks/authenticate.js';
import { historiesCoursesSchema } from './history.schema.js';
import { createHistory } from './handlers/createHistory.js';
import { seasonCourses } from './handlers/seasonCourses.js';
import type { FastifyInstance } from 'fastify';

export async function historyRoutes(app: FastifyInstance) {
  app.get(
    '/courses',
    { schema: historiesCoursesSchema, onRequest: [authenticate] },
    seasonCourses,
  );

  app.post('/sigaa', createHistory);
}
