import { isAdminHook } from '@/hooks/isAdmin.js';
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
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function privateRoutes(app: FastifyInstance) {
  app.post<SyncDisciplinasRequest>(
    '/disciplinas',
    { preValidation: [isAdminHook] },
    syncDisciplinasHandler,
  );
  app.get<SyncMatriculasRequest>(
    '/matriculas',
    { preValidation: [isAdminHook] },
    syncMatriculasHandler,
  );
  app.post<SyncEnrollmentsRequest>(
    '/enrollments',
    { preValidation: [isAdminHook] },
    syncEnrollments,
  );
}
