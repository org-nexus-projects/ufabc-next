import type { FastifySchema } from "fastify";

// Esquemas de documentação utilizando FastifySchema
export const listStudentEnrollmentSchema = {
    tags: ['Enrollment'],
    description: 'Rota para listar as matrículas dos alunos'
} satisfies FastifySchema;

export const enrollmentCommentSchema = {
    tags: ['Enrollment'],
    description: 'Rota para visualizar os comentários de uma matrícula específica',
} satisfies FastifySchema;
