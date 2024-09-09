import { SubjectModel } from '@/models/Subject.js';
import { authenticate } from '@/hooks/authenticate.js';
import { admin } from '@/hooks/admin.js';
import { SubjectRepository } from './subjects.repository.js';
import { SubjectService } from './subjects.service.js';
import { SubjectHandler } from './subjects.handlers.js';
import {
  createSubjectSchema,
  listAllSubjectsSchema,
  searchSubjectSchema,
  subjectsReviewsSchema,
} from './subjects.schema.js';
import type { FastifyInstance } from 'fastify';
import { subjectReviews } from './handlers/reviews.js';

export async function subjectsRoute(app: FastifyInstance) {
  const subjectRepository = new SubjectRepository(SubjectModel);
  const subjectService = new SubjectService(subjectRepository);
  app.decorate('subjectService', subjectService);
  const subjectHandler = new SubjectHandler(subjectService);

  app.get(
    '/subjects',
    { schema: listAllSubjectsSchema },
    subjectHandler.listAllSubjects,
  );

  app.get<{ Querystring: { q: string } }>(
    '/subjects/search',
    { schema: searchSubjectSchema, onRequest: [authenticate] },
    subjectHandler.searchSubject,
  );

  app.post<{ Body: Array<{ name: string; credits: number }> }>(
    '/private/subjects',
    { schema: createSubjectSchema, onRequest: [authenticate, admin] },
    subjectHandler.createSubject,
  );

  app.get<{ Params: { subjectId: string } }>(
    '/subjects/reviews/:subjectId',
    { schema: subjectsReviewsSchema, onRequest: [authenticate] },
    subjectReviews,
  );
}
