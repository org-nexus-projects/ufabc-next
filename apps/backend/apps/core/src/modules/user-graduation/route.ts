import { graduation } from './handlers/graduation.js';
import {
  type SubjectQueryString,
  subjectGraduation,
} from './handlers/subjects.js';
import { isAdminHook } from './hooks/isAdmin.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function graduationsRoute(app: FastifyInstance) {
  app.get('/', graduation);
  app.get<{ Querystring: SubjectQueryString }>(
    '/subject',
    { preHandler: [isAdminHook] },
    subjectGraduation,
  );
}
