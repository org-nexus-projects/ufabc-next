import { GraduationModel } from '@/models/Graduation.js';
import { GraduationRepository } from './graduation.repository.js';
import { GraduationService } from './graduation.service.js';
import { GraduationHandler } from './graduation.handlers.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function graduationRoutes(app: FastifyInstance) {
  const graduationRepository = new GraduationRepository(GraduationModel);
  const graduationService = new GraduationService(graduationRepository);
  const graduationHandler = new GraduationHandler(graduationService);

  app.decorate('graduationService', graduationHandler);

  app.post('/', graduationHandler.listGraduations);
}
