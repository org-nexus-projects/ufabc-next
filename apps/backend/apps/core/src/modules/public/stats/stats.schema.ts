import type { FastifySchema } from 'fastify';
import { z } from 'zod';

export const generalStatsSchema = {
  tags: ['Public'],
  description: 'Rota para obter estatísticas gerais',
  response: {
    200: z.object({
      teachers: z.number().int().describe('Professores no quadrimestre'),
      totalAlunos: z
        .number()
        .int()
        .describe('Quantidade total de requisições em matérias ofertadas'),
      subjects: z
        .number()
        .int()
        .describe(
          'Matérias ofertadas no quadrimestre (atualmente está incorreto)',
        ),
      users: z.number().int(),
      currentAlunos: z
        .number()
        .int()
        .describe('Alunos que utilizaram a extensão no quadrimestre'),
      comments: z.number().int(),
      enrollments: z.number().int(),
    }),
  },
} satisfies FastifySchema;

export const studentStatsSchema = {
  tags: ['Public'],
  description: 'Rota para obter estatísticas dos alunos',
} satisfies FastifySchema;

export const componentStatsSchema = {
  tags: ['Public'],
  description:
    'Rota para obter estatísticas de disciplinas baseado em uma ação',
} satisfies FastifySchema;
