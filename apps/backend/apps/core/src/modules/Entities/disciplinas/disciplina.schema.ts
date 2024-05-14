import type { FastifySchema } from "fastify";

export const listDisciplinasSchema = {
    tags: ['Disciplinas'],
    description: 'Rota para listar as disciplinas',
} satisfies FastifySchema;

export const listDisciplinasKicksSchema = {
    tags: ['Disciplinas'],
    description: 'Rota visualizar os chutes de cada disciplina',
} satisfies FastifySchema;
