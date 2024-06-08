import { GeneralStatsHandler } from "./general.handlers.js";
import { generalStatsSchema } from "./general.schema.js";
import type { FastifyInstance } from "fastify";

// eslint-disable-next-line require-await
export async function statsGeneralRoute(app: FastifyInstance) {
  const generalStatsHandler = new GeneralStatsHandler();
  app.get(
    "/stats/usage",
    { schema: generalStatsSchema },
    generalStatsHandler.generalStats,
  );
}
