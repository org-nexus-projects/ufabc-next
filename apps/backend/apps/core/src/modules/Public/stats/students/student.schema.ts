import type { FastifySchema } from "fastify";

export const studentStatsSchema = {
  tags: ["Public"],
  description: "Rota para obter estatísticas dos alunos",
} satisfies FastifySchema;