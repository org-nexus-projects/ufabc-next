import type { FastifySchema } from "fastify";

export const createStudentSchema = {
    tags: ['Student'],
    description: 'Rota para criar um novo aluno',
} satisfies FastifySchema;

export const listSeasonStudentSchema = {
    tags: ['Student'],
    description: 'Rota para listar as matérias do aluno no quadrimestre',
} satisfies FastifySchema;

export const studentDisciplinasStatsSchema = {
    tags: ['Student'],
    description: 'Rota para listar as estatísticas das disciplinas por aluno',
} satisfies FastifySchema;