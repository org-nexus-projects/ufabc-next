import { admin } from '@/hooks/admin.js';
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
export async function syncRoutes(app: FastifyInstance) {
  app.post<SyncDisciplinasRequest>(
    '/disciplinas',
    { preValidation: [admin] },
    syncDisciplinasHandler,
  );
  app.get<SyncMatriculasRequest>(
    '/matriculas',
    { preValidation: [admin] },
    syncMatriculasHandler,
  );
  app.post<SyncEnrollmentsRequest>(
    '/enrollments',
    { preValidation: [admin] },
    syncEnrollments,
  );
}
