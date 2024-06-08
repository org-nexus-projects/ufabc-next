import type { FastifySchema } from "fastify";

export const generalStatsSchema = {
  tags: ["Public"],
  description: "Rota para obter estatísticas gerais",
} satisfies FastifySchema;
