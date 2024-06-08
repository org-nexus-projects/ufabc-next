import type { FastifySchema } from "fastify";

export const syncDisciplinasSchema = {
  tags: ["Sync"],
  description: "Rota para sincronizar disciplinas",
} satisfies FastifySchema;

export const syncMatriculasSchema = {
  tags: ["Sync"],
  description: "Rota para sincronizar matrículas",
} satisfies FastifySchema;

export const syncEnrollmentsSchema = {
  tags: ["Sync"],
  description: "Rota para sincronizar inscrições",
} satisfies FastifySchema;

export const parseTeachersSchema = {
  tags: ["Sync"],
  description: "Rota para analisar e sincronizar professores em disciplinas",
} satisfies FastifySchema;
