import { StudentModel } from '@/models/Student.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { DisciplinaModel } from '@/models/Disciplina.js';
import { StudentRepository } from './students.repository.js';
import { StudentService } from './students.service.js';
import { StudentHandler } from './students.handlers.js';
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

  app.post('/student', studentHandler.createStudent);
}
