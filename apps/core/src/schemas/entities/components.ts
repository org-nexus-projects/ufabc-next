import { currentQuad } from '@next/utils';
import type { FastifySchema } from 'fastify';
import { z } from 'zod';

const NonPaginatedComponentsSchema = z.object({
  identifier: z.string().optional().nullable(),
  disciplina_id: z
    .number()
    .int()
    .optional()
    .nullable()
    .meta({ description: 'Id da disciplina para a UFABC' }),
  subject: z.string().meta({ description: 'Nome da matéria ofertada' }),
  turma: z.string(),
  turno: z.enum(['diurno', 'noturno']),
  vagas: z.number().int(),
  requisicoes: z.number().int(),
  campus: z.enum(['sbc', 'sa', 'santo andre', 'sao bernardo']),
  teoria: z.string().optional().meta({ description: 'Nome do professor' }),
  pratica: z.string().optional().meta({ description: 'Nome do professor' }),
  teoriaId: z.any(), // z.coerce.string().optional().meta({ description: 'Id interno' }),
  season: z.string().meta({ description: 'Chave do tenant' }),
  praticaId: z.any(),
  groupURL: z.string().optional().meta({
    description: 'Link do grupo de WhatsApp',
  }),
  uf_cod_turma: z
    .string()
    .optional()
    .meta({ description: 'Código da turma na UFABC' }),
  subjectId: z.coerce.string().optional().meta({ description: 'Id interno' }),
});

export type NonPaginatedComponents = z.infer<
  typeof NonPaginatedComponentsSchema
>;

export const listKickedSchema = {
  params: z.object({
    componentId: z.coerce.number().int(),
  }),
  querystring: z.object({
    sort: z.enum(['reserva', 'turno', 'ik', 'cp', 'cr']).optional(),
    season: z
      .string()
      .refine((val) => {
        const [year, quad] = val.split(':');

        if (!year || !quad) {
          return false;
        }

        return true;
      })
      .default(currentQuad()),
    studentId: z.coerce.number().optional(),
  }),
  response: {
    200: z.any(),
  },
} satisfies FastifySchema;
