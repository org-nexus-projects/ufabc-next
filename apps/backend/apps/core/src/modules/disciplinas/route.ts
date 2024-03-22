import { authenticate } from '@/hooks/authenticate.js';
import { isAdminValidator } from '../private/isAdmin.js';
import {
  type ParseTeachersRequest,
  parseTeachersHandler,
} from './handlers/parseTeachers.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function disciplinasRoute(app: FastifyInstance) {
  app.put<ParseTeachersRequest>(
    '/teachers',
    { preValidation: [isAdminValidator], onRequest: [authenticate] },
    parseTeachersHandler,
  );
}
