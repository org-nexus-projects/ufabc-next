import type { FastifySchema } from "fastify";

export const listGraduationsSchema = {
  tags: ["Graduation"],
  description: "Rota para listar graduações com um limite de resultados",
} satisfies FastifySchema;

export const listGraduationsSubjectsSchema = {
  tags: ["Graduation"],
  description: "Rota para listar as matérias da graduação",
} satisfies FastifySchema;

export const listGraduationSubjectsByGraduationIdSchema = {
  tags: ["Graduation"],
  description:
    "Rota para listar as matérias de uma graduação específica por ID da graduação",
} satisfies FastifySchema;