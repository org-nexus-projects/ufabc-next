import { authenticate } from '@/hooks/authenticate.js';
import { DisciplinaModel } from '@/models/Disciplina.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { StudentModel } from '@/models/Student.js';
import { StudentHandler } from './students.handlers.js';
import { StudentRepository } from './students.repository.js';
import { createStudentSchema, listSeasonStudentSchema, studentDisciplinasStatsSchema } from './students.schema.js';
import { StudentService } from './students.service.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function studentsRoute(app: FastifyInstance) {
  const studentRepository = new StudentRepository(
    StudentModel,
    GraduationHistoryModel,
    DisciplinaModel,
  );
  const studentService = new StudentService(studentRepository);
  app.decorate('studentService', studentService);
  const studentHandler = new StudentHandler(studentService);

  app.post(
    "/student",
    { schema: createStudentSchema },
    studentHandler.createStudent,
  );
  app.get(
    "/student/studentId/",
    { schema: listSeasonStudentSchema, onRequest: [authenticate] },
    studentHandler.listSeasonStudent,
  );
  app.get(
    "/student/stats/disciplinas",
    { schema: studentDisciplinasStatsSchema },
    studentHandler.studentDisciplinasStats,
  );
}
