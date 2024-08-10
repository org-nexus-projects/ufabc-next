import { admin } from '@/hooks/admin.js';
import { authenticate } from '@/hooks/authenticate.js';
import { syncComponentsHandler } from './handlers/components.js';
import { syncEnrollments } from './handlers/enrollments.js';
import {
  type SyncMatriculasRequest,
  syncEnrolledHandler,
} from './handlers/ufEnrolled.js';
import { componentsTeachers } from './handlers/componentsTeachers.js';
import {
  syncEnrollmentsLegacy,
  type SyncEnrollmentsRequest,
} from './handlers/syncEnrollments.js';
import {
  syncComponentsTeacherSchema,
  syncComponentsSchema,
  syncEnrollmentsSchema,
  syncEnrolledSchema,
} from './sync.schema.js';
import type { FastifyInstance } from 'fastify';

export async function syncRoutes(app: FastifyInstance) {
  app.post(
    '/disciplinas',
    { schema: syncComponentsSchema, preValidation: [authenticate, admin] },
    syncComponentsHandler,
  );

  app.get<SyncMatriculasRequest>(
    '/matriculas',
    { schema: syncEnrolledSchema, preValidation: [authenticate, admin] },
    syncEnrolledHandler,
  );

  app.post(
    '/enrollments',
    { schema: syncEnrollmentsSchema, preValidation: [authenticate, admin] },
    syncEnrollments,
  );

  app.post<SyncEnrollmentsRequest>(
    '/enrollments/legacy',
    { preValidation: [authenticate, admin] },
    syncEnrollmentsLegacy,
  );

  app.put(
    '/disciplinas/teachers',
    {
      schema: syncComponentsTeacherSchema,
      preValidation: [authenticate, admin],
    },
    componentsTeachers,
  );
}
