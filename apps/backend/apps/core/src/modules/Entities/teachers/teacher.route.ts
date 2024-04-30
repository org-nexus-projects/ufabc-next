import { type Teacher, TeacherModel } from '@/models/Teacher.js';
import { authenticate } from '@/hooks/authenticate.js';
import { admin } from '@/hooks/admin.js';
import { TeacherRepository } from './teacher.repository.js';
import { TeacherService } from './teacher.service.js';
import {
  TeacherHandler,
  type UpdateTeacherRequest,
} from './teacher.handlers.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function teacherRoutes(app: FastifyInstance) {
  const teacherRepository = new TeacherRepository(TeacherModel);
  const teacherService = new TeacherService(teacherRepository);
  app.decorate('teacherService', teacherService);
  const teacherHandler = new TeacherHandler(teacherService);

  app.get('/teacher', teacherHandler.listAllTeachers);
  app.post<{ Body: Teacher }>(
    '/private/teacher',
    { onRequest: [authenticate, admin] },
    teacherHandler.createTeacher,
  );

  app.put<UpdateTeacherRequest>(
    '/private/teacher/:teacherId',
    { onRequest: [authenticate, admin] },
    teacherHandler.updateTeacher,
  );

  app.get<{ Querystring: { q: string } }>(
    '/teacher/search',
    { onRequest: [authenticate] },
    teacherHandler.searchTeacher,
  );

  app.get<{ Params: { teacherId: string } }>(
    '/teacher/review/:teacherId',
    { onRequest: [authenticate] },
    teacherHandler.teacherReview,
  );

  app.delete<{ Params: { teacherId: string } }>(
    '/private/teacher/:teacherId',
    { onRequest: [admin, authenticate] },
    teacherHandler.removeTeacher,
  );
}
