import type { FastifySchema } from "fastify";

export const listDisciplinasSchema = {
    tags: ['Disciplina'],
    description: 'Rota para listar as disciplinas do quadrimestre atual',
} satisfies FastifySchema;

export const listDisciplinasKicksSchema = {
    tags: ['Disciplina'],
    description: 'Rota visualizar os chutes de cada disciplina',
} satisfies FastifySchema;
