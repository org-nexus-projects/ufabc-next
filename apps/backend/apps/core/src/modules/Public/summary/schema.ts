import { z } from 'zod';

const summaryResponse = z.object({
  teachers: z
    .number()
    .describe('Quantidade de professores que temos na base de dados'),
  subjects: z
    .number()
    .describe('Quantidade de matérias que temos na base de dados'),
  users: z.number().describe('Quantidade de usuários cadastrados'),
  currentStudents: z
    .number()
    .describe('Alunos utilizando o Next nesse Quadrimestre'),
  comments: z
    .number()
    .describe('Quantidade de comentários que temos na base de dads'),
  enrollments: z
    .number()
    .describe('Matérias do quadrimestre e notas de alunos'),
});

export const summarySchema = {
  $id: 'summarySchema',
  tags: ['Public'],
  description: 'Rota para retornar, informações sobre o uso do Next',
  response: {
    200: summaryResponse,
  },
};
