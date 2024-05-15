import { DisciplinaStatsHandler } from './disciplinaStats.handler.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function statsDisciplinaRoute(app: FastifyInstance) {
  const disciplinaStatsHandler = new DisciplinaStatsHandler();
  app.get('/stats/disciplinas/:action', disciplinaStatsHandler.disciplinaStats);
}
