import { DisciplinaModel } from '@/models/Disciplina.js';
import { StudentModel } from '@/models/Student.js';
import { setStudentId } from '@/hooks/setStudentId.js';
import { DisciplinaRepository } from './disciplina.repository.js';
import {
  DisciplinaHandler,
  type DisciplinaKicksRequest,
} from './disciplina.handlers.js';
import { DisciplinaService } from './disciplina.service.js';

import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function disciplinasRoute(app: FastifyInstance) {
  const disciplinaRepository = new DisciplinaRepository(
    DisciplinaModel,
    StudentModel,
  );
  const disciplinaService = new DisciplinaService(disciplinaRepository);
  app.decorate('disciplinaService', disciplinaService);
  const disciplinaHandler = new DisciplinaHandler(disciplinaService);

  app.get('/disciplina', disciplinaHandler.listDisciplinas);
  app.get<DisciplinaKicksRequest>(
    '/disciplina/:disciplinaId/kicks',
    { onRequest: [setStudentId] },
    disciplinaHandler.listDisciplinasKicks,
  );
}
