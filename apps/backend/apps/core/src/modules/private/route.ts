import {
  type SyncEnrollmentsRequest,
  syncEnrollments,
} from './handlers/syncEnrollments.js';
import { syncMatriculasHandler } from './handlers/syncMatriculas.js';
import { isAdminValidator } from './isAdmin.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function privateRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: 'alunos_matriculados' | 'before_kick' | 'after_kick';
  }>(
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
