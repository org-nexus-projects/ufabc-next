import { admin } from '@/hooks/admin.js';
import { authenticate } from '@/hooks/authenticate.js';
import { syncEnrollments } from './handlers/enrollments.js';
import { syncEnrolledHandler } from './handlers/ufEnrolled.js';
import { componentsTeachers } from './handlers/componentsTeachers.js';
import {
  syncEnrollmentsLegacy,
  type SyncEnrollmentsRequest,
} from './handlers/syncEnrollments.js';
import {
  syncComponentsTeacherSchema,
  syncEnrollmentsSchema,
  syncEnrolledSchema,
} from './sync.schema.js';
import type { FastifyInstance } from 'fastify';

export async function syncRoutes(app: FastifyInstance) {
  app.addHook('preValidation', authenticate);
  app.addHook('preValidation', admin);

  app.get('/matriculas', { schema: syncEnrolledSchema }, syncEnrolledHandler);
  app.post('/enrollments', { schema: syncEnrollmentsSchema }, syncEnrollments);
  app.post<SyncEnrollmentsRequest>(
    '/enrollments/legacy',
    syncEnrollmentsLegacy,
  );
  app.put(
    '/disciplinas/teachers',
    {
      schema: syncComponentsTeacherSchema,
    },
    componentsTeachers,
  );
}
