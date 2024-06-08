import type { FastifySchema } from "fastify";

export const disciplinaStatsSchema = {
  tags: ["Public"],
  description: "Rota para obter estatísticas de disciplinas baseado em uma ação",
} satisfies FastifySchema;