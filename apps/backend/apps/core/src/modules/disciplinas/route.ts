import { authenticate } from '@/hooks/authenticate.js';
import { admin } from '@/hooks/admin.js';
import {
  type ParseTeachersRequest,
  parseTeachersHandler,
} from './handlers/parseTeachers.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function disciplinasRoute(app: FastifyInstance) {
  app.put<ParseTeachersRequest>(
    '/teachers',
    { onRequest: [authenticate, admin] },
    parseTeachersHandler,
  );
}
