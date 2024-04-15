import { SubjectModel } from '@/models/Subject.js';
import { authenticate } from '@/hooks/authenticate.js';
import { admin } from '@/hooks/admin.js';
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

  app.get('/subject/', subjectHandler.listAllSubjects);

  app.get<{ Querystring: { q: string } }>(
    '/subject/search',
    { onRequest: [authenticate] },
    subjectHandler.searchSubject,
  );

  app.post<{ Body: { name: string } }>(
    '/private/subject/create',
    { onRequest: [authenticate, admin] },
    subjectHandler.createSubject,
  );

  app.get<{ Params: { subjectId: string } }>(
    '/subject/review/:subjectId',
    { onRequest: [authenticate] },
    subjectHandler.subjectsReviews,
  );
}
