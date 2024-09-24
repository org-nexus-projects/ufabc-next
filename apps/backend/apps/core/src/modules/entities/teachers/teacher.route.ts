import { admin } from '@/hooks/admin.js';
import { authenticate } from '@/hooks/authenticate.js';
import { type Teacher, TeacherModel } from '@/models/Teacher.js';
import {
  TeacherHandler,
  type UpdateTeacherRequest,
} from './teacher.handlers.js';
import { TeacherRepository } from './teacher.repository.js';
import {
  createTeacherSchema,
  listAllTeachersSchema,
  removeTeacherSchema,
  searchTeacherSchema,
  teacherReviewSchema,
  updateTeacherSchema,
} from './teacher.schema.js';
import { TeacherService } from './teacher.service.js';
import { teacherReviews } from './handlers/reviews.js';
import type { FastifyInstance } from 'fastify';

export async function teacherRoutes(app: FastifyInstance) {
  const teacherRepository = new TeacherRepository(TeacherModel);
  const teacherService = new TeacherService(teacherRepository);
  app.decorate('teacherService', teacherService);
  const teacherHandler = new TeacherHandler(teacherService);

  app.get(
    '/teachers',
    { schema: listAllTeachersSchema, onRequest: [authenticate] },
    teacherHandler.listAllTeachers,
  );

  app.post<{ Body: Teacher }>(
    '/private/teachers',
    { schema: createTeacherSchema, onRequest: [authenticate, admin] },
    teacherHandler.createTeacher,
  );

  app.put<UpdateTeacherRequest>(
    '/private/teachers/:teacherId',
    { schema: updateTeacherSchema, onRequest: [authenticate, admin] },
    teacherHandler.updateTeacher,
  );

  app.get<{ Querystring: { q: string } }>(
    '/teachers/search',
    { schema: searchTeacherSchema, onRequest: [authenticate] },
    teacherHandler.searchTeacher,
  );

  app.get<{ Params: { teacherId: string } }>(
    '/teachers/reviews/:teacherId',
    { schema: teacherReviewSchema },
    teacherReviews,
  );

  app.delete<{ Params: { teacherId: string } }>(
    '/private/teachers/:teacherId',
    { schema: removeTeacherSchema, onRequest: [admin, authenticate] },
    teacherHandler.removeTeacher,
  );
}
