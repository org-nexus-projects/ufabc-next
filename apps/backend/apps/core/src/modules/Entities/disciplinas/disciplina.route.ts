import { DisciplinaModel } from '@/models/Disciplina.js';
import { DisciplinaRepository } from './disciplina.repository.js';
import { DisciplinaHandler } from './disciplina.handlers.js';
import { DisciplinaService } from './disciplina.service.js';

import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function disciplinasRoute(app: FastifyInstance) {
  const disciplinaRepository = new DisciplinaRepository(DisciplinaModel);
  const disciplinaService = new DisciplinaService(disciplinaRepository);
  app.decorate('disciplinaService', disciplinaService);
  const disciplinaHandler = new DisciplinaHandler(disciplinaService);

  app.get('/disciplina', disciplinaHandler.listDisciplinas);
}
