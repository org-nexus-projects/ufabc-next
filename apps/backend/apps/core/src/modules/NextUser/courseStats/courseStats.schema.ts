import type { FastifySchema } from "fastify";

export const gradesStatsSchema = {
  tags: ["Course Stats"],
  description: "Rota para obter estatísticas de notas dos cursos",
} satisfies FastifySchema;

export const graduationHistorySchema = {
  tags: ["Course Stats"],
  description: "Rota para obter o histórico de graduação por RA (Registro Acadêmico)",
} satisfies FastifySchema;

export const userGraduationStatsSchema = {
  tags: ["Course Stats"],
  description: "Rota para obter estatísticas de graduação do usuário",
} satisfies FastifySchema;