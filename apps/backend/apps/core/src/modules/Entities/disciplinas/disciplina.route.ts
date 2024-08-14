import { setStudentId } from '@/hooks/setStudentId.js';
import {
  listDisciplinasKicksSchema,
  listDisciplinasSchema,
} from './disciplina.schema.js';

import type { FastifyInstance } from 'fastify';
import { listComponents } from './handlers/listComponents.js';
import { listKicked } from './handlers/listKicked.js';
import {
  listDisciplinasKicks,
  type DisciplinaKicksRequest,
} from './handlers/legacyListKicked.js';

export async function disciplinasRoute(app: FastifyInstance) {
  app.get('/disciplina', { schema: listDisciplinasSchema }, listComponents);
  app.get(
    '/component/:componentId/kicks',
    { schema: listDisciplinasKicksSchema, onRequest: [setStudentId] },
    listKicked,
  );
  app.get<DisciplinaKicksRequest>(
    '/disciplina/:disciplinaId/kicks',
    { onRequest: [setStudentId] },
    listDisciplinasKicks,
  );
}
