import { admin } from '@/hooks/admin.js';
import { authenticate } from '@/hooks/authenticate.js';
import { syncComponentsHandler } from './handlers/components.js';
import {
  type SyncEnrollmentsRequest,
  syncEnrollments,
} from './handlers/syncEnrollments.js';
import {
  type SyncMatriculasRequest,
  syncMatriculasHandler,
} from './handlers/syncMatriculas.js';
import { componentsTeachers } from './handlers/componentsTeachers.js';
import {
  syncComponentsWithTeachers,
  syncComponentsSchema,
  syncEnrollmentsSchema,
  syncMatriculasSchema,
} from './sync.schema.js';
import type { FastifyInstance } from 'fastify';

export async function syncRoutes(app: FastifyInstance) {
  app.post(
    '/disciplinas',
    { schema: syncComponentsSchema, preValidation: [authenticate] },
    syncComponentsHandler,
  );

  app.get<SyncMatriculasRequest>(
    '/matriculas',
    { schema: syncMatriculasSchema, preValidation: [authenticate, admin] },
    syncMatriculasHandler,
  );

  app.post<SyncEnrollmentsRequest>(
    '/enrollments',
    { schema: syncEnrollmentsSchema, preValidation: [authenticate, admin] },
    syncEnrollments,
  );

  app.put(
    '/disciplinas/teachers',
    // {
    //   schema: syncComponentsWithTeachers,
    //   preValidation: [authenticate, admin],
    // },
    componentsTeachers,
  );
}
