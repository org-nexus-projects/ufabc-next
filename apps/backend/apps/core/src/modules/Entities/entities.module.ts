import { teacherRoutes } from './teachers/teacher.route.js';
import { subjectsRoute } from './subjects/subjects.route.js';
import { studentsRoute } from './students/students.route.js';
import { enrollmentsRoute } from './enrollments/enrollments.route.js';
import { disciplinasRoute } from './disciplinas/disciplina.route.js';
import type { FastifyInstance } from 'fastify';

export async function entitiesModule(app: FastifyInstance) {
  await app.register(teacherRoutes, {
    prefix: '/entities',
  });
  await app.register(subjectsRoute, {
    prefix: '/entities',
  });
  await app.register(studentsRoute, {
    prefix: '/entities',
  });
  await app.register(enrollmentsRoute, {
    prefix: '/entities',
  });
  await app.register(disciplinasRoute, {
    prefix: '/entities',
  });
}
