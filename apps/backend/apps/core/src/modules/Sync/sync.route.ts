import { admin } from '@/hooks/admin.js';
import { authenticate } from '@/hooks/authenticate.js';
import {
  type SyncDisciplinasRequest,
  syncDisciplinasHandler,
} from './handlers/syncDisciplinas.js';
import {
  type SyncEnrollmentsRequest,
  syncEnrollments,
} from './handlers/syncEnrollments.js';
import {
  type SyncMatriculasRequest,
  syncMatriculasHandler,
} from './handlers/syncMatriculas.js';
import {
  type ParseTeachersRequest,
  parseTeachersHandler,
} from './handlers/syncTeachersToSubject.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function syncRoutes(app: FastifyInstance) {
  app.post<SyncDisciplinasRequest>(
    '/disciplinas',
    { preValidation: [authenticate, admin] },
    syncDisciplinasHandler,
  );
  app.get<SyncMatriculasRequest>(
    '/matriculas',
    { preValidation: [authenticate, admin] },
    syncMatriculasHandler,
  );
  app.post<SyncEnrollmentsRequest>(
    '/enrollments',
    { preValidation: [authenticate, admin] },
    syncEnrollments,
  );
  app.put<ParseTeachersRequest>(
    '/disciplinas/teachers',
    // { preValidation: [authenticate, admin] },
    parseTeachersHandler,
  );
}
