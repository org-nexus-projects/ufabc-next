import { isAdminHook } from './hooks/isAdmin.js';
import {
  type SubjectQueryString,
  subjectGraduation,
} from './handlers/subjects.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function graduationsRoute(app: FastifyInstance) {
  app.get<{ Querystring: SubjectQueryString }>(
    '/subject',
    { preHandler: [isAdminHook] },
    subjectGraduation,
  );
}
