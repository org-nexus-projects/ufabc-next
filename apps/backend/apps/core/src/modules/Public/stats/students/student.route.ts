import { StudentStatsHandler } from './student.handlers.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function statsStudentRoute(app: FastifyInstance) {
  const studentStatsHandler = new StudentStatsHandler();
  app.get('/stats/student', studentStatsHandler.studentStats);
}
