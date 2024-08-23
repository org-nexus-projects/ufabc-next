import { setStudentId } from '@/hooks/setStudentId.js';
import {
  listComponentsKicksSchema,
  listComponentsSchema,
} from './component.schema.js';
import { listComponents } from './handlers/listComponents.js';
import { listKicked } from './handlers/listKicked.js';
import {
  listDisciplinasKicks,
  type DisciplinaKicksRequest,
} from './handlers/legacyListKicked.js';
import type { FastifyInstance } from 'fastify';

export async function componentsRoute(app: FastifyInstance) {
  app.get('/components', { schema: listComponentsSchema }, listComponents);
  app.get(
    '/components/:componentId/kicks',
    { schema: listComponentsKicksSchema, onRequest: [setStudentId] },
    listKicked,
  );
  app.get<DisciplinaKicksRequest>(
    '/disciplina/:disciplinaId/kicks',
    { onRequest: [setStudentId] },
    listDisciplinasKicks,
  );
}
