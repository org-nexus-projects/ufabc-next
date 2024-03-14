import { SubjectModel } from '@/models/Subject.js';
import { authenticate } from '@/hooks/authenticate.js';
import { SubjectRepository } from './subjects.repository.js';
import { SubjectService } from './subjects.service.js';
import { SubjectHandler } from './subjects.handlers.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function subjectsRoute(app: FastifyInstance) {
  const subjectRepository = new SubjectRepository(SubjectModel);
  const subjectService = new SubjectService(subjectRepository);
  app.decorate('subjectService', subjectService);
  const subjectHandler = new SubjectHandler(subjectService);

  app.get<{ Querystring: { q: string } }>(
    '/subject/search',
    { onRequest: [authenticate] },
    subjectHandler.searchSubject,
  );
}
