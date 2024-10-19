import type { FastifySchema } from 'fastify';
import { z } from 'zod';

export const listComponentsSchema = {
  tags: ['Components'],
  description: 'Rota para listar as disciplinas do quadrimestre atual',
  response: {
    200: z
      .object({
        identifier: z.string(),
        disciplina_id: z
          .number()
          .int()
          .describe('Id da disciplina para a UFABC'),
        subject: z.string().describe('Nome da matéria ofertada'),
        turma: z.string(),
        turno: z.enum(['diurno', 'noturno']),
        vagas: z.number().int(),
        requisicoes: z.number().int(),
        campus: z.enum(['sbc', 'sa', 'santo andre', 'sao bernardo']),
        teoria: z.string().optional().describe('Nome do professor'),
        pratica: z.string().optional().describe('Nome do professor'),
        teoriaId: z.coerce.string().optional().describe('Id interno'),
        praticaId: z.coerce.string().optional().describe('Id interno'),
        subjectId: z.coerce.string().optional().describe('Id interno'),
      })
      .array(),
  },
} satisfies FastifySchema;

export const listComponentsKicksSchema = {
  tags: ['Components'],
  description: 'Rota visualizar os chutes de cada disciplina',
  response: {
    200: z
      .object({
        studentId: z.number().int().describe('Id do aluno para a UFABC'),
        cp: z.number().describe('CP do aluno'),
        ik: z.number(),
        reserva: z.boolean(),
        turno: z.enum(['Matutino', 'Noturno']),
        curso: z.string().describe('Curso do aluno'),
        kicked: z
          .boolean()
          .describe('Variável que diz se o aluno foi ou não chutado'),
      })
      .array(),
  },
} satisfies FastifySchema;
