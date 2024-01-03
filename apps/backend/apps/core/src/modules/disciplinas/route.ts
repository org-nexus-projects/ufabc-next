import { listDisciplinas } from './handlers/listDisciplinas.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function disciplinasRoute(app: FastifyInstance) {
  app.get('/', listDisciplinas);
}
