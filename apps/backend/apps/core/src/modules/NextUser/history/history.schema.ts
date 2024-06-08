import type { FastifySchema } from "fastify";

export const userHistorySchema = {
  tags: ["History"],
  description: "Rota para registrar o histórico do usuário",
} satisfies FastifySchema;

export const historiesCoursesSchema = {
  tags: ["History"],
  description: "Rota para obter o histórico de matérias do quadrimestre atual",
} satisfies FastifySchema;
