import { DisciplinaStatsHandler } from './disciplinaStats.handler.js';
import { disciplinaStatsSchema } from './disciplinaStats.schema.js';
import type { FastifyInstance } from 'fastify';


export async function statsDisciplinaRoute(app: FastifyInstance) {
  const disciplinaStatsHandler = new DisciplinaStatsHandler();
  app.get(
    "/stats/disciplinas/:action",
    { schema: disciplinaStatsSchema },
    disciplinaStatsHandler.disciplinaStats,
  );
}
