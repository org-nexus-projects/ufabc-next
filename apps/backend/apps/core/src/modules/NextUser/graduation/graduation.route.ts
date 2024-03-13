import { GraduationModel } from '@/models/Graduation.js';
import { GraduationSubjectModel } from '@/models/GraduationSubject.js';
import { isAdminHook } from '@/hooks/isAdmin.js';
import { authenticate } from '@/hooks/authenticate.js';
import { GraduationRepository } from './graduation.repository.js';
import { GraduationService } from './graduation.service.js';
import { GraduationHandler } from './graduation.handlers.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function graduationRoutes(app: FastifyInstance) {
  const graduationRepository = new GraduationRepository(
    GraduationModel,
    GraduationSubjectModel,
  );
  const graduationService = new GraduationService(graduationRepository);
  const graduationHandler = new GraduationHandler(graduationService);

  app.decorate('graduationService', graduationService);

  app.get(
    '/',
    { onRequest: [authenticate] },
    graduationHandler.listGraduations,
  );
  app.get(
    '/subjects',
    { onRequest: [authenticate, isAdminHook] },
    graduationHandler.listGraduationsSubjects,
  );
}
