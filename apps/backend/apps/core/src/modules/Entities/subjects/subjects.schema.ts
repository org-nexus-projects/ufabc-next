import type { FastifySchema } from "fastify";

export const listAllSubjectsSchema = {
    tags: ['Subject'],
    description: 'Rota para listar todas as disciplinas',
} satisfies FastifySchema;

export const searchSubjectSchema = {
    tags: ['Subject'],
    description: 'Rota para pesquisar disciplinas',
} satisfies FastifySchema;

export const createSubjectSchema = {
    tags: ['Private'],
    hide: true,
    description: 'Rota para criar uma nova disciplina',
} satisfies FastifySchema;

export const subjectsReviewsSchema = {
    tags: ['Subject'],
    description: 'Rota para visualizar avaliações de uma disciplina',
} satisfies FastifySchema;
