import { GeneralStatsHandler } from "./general.handlers.js";
import { generalStatsSchema } from "./general.schema.js";
import type { FastifyInstance } from "fastify";


export async function statsGeneralRoute(app: FastifyInstance) {
  const generalStatsHandler = new GeneralStatsHandler();
  app.get(
    "/stats/usage",
    { schema: generalStatsSchema },
    generalStatsHandler.generalStats,
  );
}
