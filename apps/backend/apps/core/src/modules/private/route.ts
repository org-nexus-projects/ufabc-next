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
import { isAdminValidator } from './isAdmin.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function privateRoutes(app: FastifyInstance) {
  app.post<SyncDisciplinasRequest>(
    '/disciplinas/sync',
    // { preValidation: [isAdminValidator] },
    syncDisciplinasHandler,
  );
  app.get<SyncMatriculasRequest>(
    '/matriculas/sync',
    { preValidation: [isAdminValidator] },
    syncMatriculasHandler,
  );
  app.post<SyncEnrollmentsRequest>(
    '/enrollments/sync',
    { preValidation: [isAdminValidator] },
    syncEnrollments,
  );
}
