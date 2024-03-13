import { type Teacher, TeacherModel } from '@/models/Teacher.js';
import { authenticate } from '@/hooks/authenticate.js';
import { isAdminHook } from '@/hooks/isAdmin.js';
import { TeacherRepository } from './teacher.repository.js';
import { TeacherService } from './teacher.service.js';
import { TeacherHandler } from './teacher.handlers.js';
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
    { onRequest: [authenticate, isAdminHook] },
    teacherHandler.createTeacher,
  );
}
