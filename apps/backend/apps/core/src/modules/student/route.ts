import { createStudents } from './handlers/createStudents.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function studentRoute(app: FastifyInstance) {
  app.post('/', createStudents);
}
