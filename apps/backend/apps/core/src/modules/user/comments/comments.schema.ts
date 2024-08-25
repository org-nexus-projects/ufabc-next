import type { FastifySchema } from "fastify";

export const createCommentSchema = {
  tags: ["Comment"],
  description: "Rota para criar um novo comentário",
} satisfies FastifySchema;

export const updateCommentSchema = {
  tags: ["Comment"],
  description: "Rota para atualizar um comentário",
} satisfies FastifySchema;

export const deleteCommentSchema = {
  tags: ["Comment"],
  description: "Rota para deletar um comentário",
} satisfies FastifySchema;

export const missingCommentSchema = {
  tags: ["Comment"],
  description: "Rota para verificar comentários faltantes de um usuário",
} satisfies FastifySchema;

export const commentsOnTeacherSchema = {
  tags: ["Comment"],
  description: "Rota para listar comentários em um professor específico por matéria",
} satisfies FastifySchema;

export const createCommentReactionSchema = {
  tags: ["Reaction"],
  description: "Rota para criar uma reação a um comentário",
} satisfies FastifySchema;

export const removeCommentReactionSchema = {
  tags: ["Reaction"],
  description: "Rota para remover uma reação de um comentário",
} satisfies FastifySchema;
