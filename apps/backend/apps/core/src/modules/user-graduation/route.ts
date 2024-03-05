import { authenticate } from '@/hooks/authenticate.js';
import { isAdminHook } from './hooks/isAdmin.js';
import { graduation } from './handlers/graduation.js';
import {
  type SubjectQueryString,
  subjectGraduation,
} from './handlers/subjects.js';
import { historiesGraduation } from './handlers/getHistoriesGraduation.js';
import { grades } from './handlers/grades.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function graduationsRoute(app: FastifyInstance) {
  app.get('/', graduation);
  app.get<{ Querystring: SubjectQueryString }>(
    '/subject',
    { preHandler: [isAdminHook] },
    subjectGraduation,
  );
  app.get<{ Querystring: { ra: number } }>(
    '/histories',
    { onRequest: [authenticate] },
    historiesGraduation,
  );
  app.get('/grades', grades);
}
