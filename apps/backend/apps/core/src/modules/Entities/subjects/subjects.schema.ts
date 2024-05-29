import type { FastifySchema } from "fastify";

export const listAllSubjectsSchema = {
    tags: ['Subjects'],
    description: 'Rota para listar todas as disciplinas',
} satisfies FastifySchema;

export const searchSubjectSchema = {
    tags: ['Subjects'],
    description: 'Rota para pesquisar disciplinas',
} satisfies FastifySchema;

export const createSubjectSchema = {
    tags: ['Subjects'],
    description: 'Rota para criar uma nova disciplina',
} satisfies FastifySchema;

export const subjectsReviewsSchema = {
    tags: ['Subjects'],
    description: 'Rota para visualizar avaliações de uma disciplina',
} satisfies FastifySchema;
