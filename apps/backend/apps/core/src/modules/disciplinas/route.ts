import { authenticate } from '@/hooks/authenticate.js';
import { isAdminValidator } from '../private/isAdmin.js';
import { listDisciplinas } from './handlers/listDisciplinas.js';
import { getDisciplinasKicks } from './handlers/getDisciplinasKicks.js';
import {
  type ParseTeachersRequest,
  parseTeachersHandler,
} from './handlers/parseTeachers.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function disciplinasRoute(app: FastifyInstance) {
  app.get('/', listDisciplinas);
  app.get('/:disciplinaId/kicks', getDisciplinasKicks);
  app.put<ParseTeachersRequest>(
    '/teachers',
    { preValidation: [isAdminValidator], onRequest: [authenticate] },
    parseTeachersHandler,
  );
}
