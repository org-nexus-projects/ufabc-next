import type { FastifySchema } from "fastify";

export const listAllTeachersSchema = {
  tags: ["Teacher"],
  description: "Rota para listar todos os professores",
} satisfies FastifySchema;

export const createTeacherSchema = {
  tags: ["Private"],
  hide: true,
  description: "Rota para criar um novo professor",
} satisfies FastifySchema;

export const updateTeacherSchema = {
  tags: ["Private"],
  hide: true,
  description: "Rota para atualizar informações de um professor",
} satisfies FastifySchema;

export const searchTeacherSchema = {
  tags: ["Teacher"],
  description: "Rota para pesquisar professores",
} satisfies FastifySchema;

export const teacherReviewSchema = {
  tags: ["Teacher"],
  description: "Rota para visualizar avaliações de um professor",
} satisfies FastifySchema;

export const removeTeacherSchema = {
  tags: ["Private"],
  hide: true,
  description: "Rota para remover um professor",
} satisfies FastifySchema;
