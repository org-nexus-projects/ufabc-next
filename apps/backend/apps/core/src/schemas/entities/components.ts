import { currentQuad } from '@next/common';
import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';
import { Types } from 'mongoose';
import { z } from 'zod';
import 'zod-openapi/extend';

const NonPaginatedComponentsSchema = z.object({
  identifier: z.string().optional().nullable(),
  disciplina_id: z
    .number()
    .int()
    .optional()
    .nullable()
    .openapi({ description: 'Id da disciplina para a UFABC' }),
  subject: z.string().openapi({ description: 'Nome da matéria ofertada' }),
  turma: z.string(),
  turno: z.enum(['diurno', 'noturno']),
  vagas: z.number().int(),
  requisicoes: z.number().int(),
  campus: z.enum(['sbc', 'sa', 'santo andre', 'sao bernardo']),
  teoria: z.string().optional().openapi({ description: 'Nome do professor' }),
  pratica: z.string().optional().openapi({ description: 'Nome do professor' }),
  teoriaId: z.any(), // z.coerce.string().optional().openapi({ description: 'Id interno' }),
  season: z.string().openapi({ description: 'Chave do tenant' }),
  praticaId: z.any(),
  groupURL: z.string().optional().openapi({
    description: 'Link do grupo de WhatsApp',
  }),
  uf_cod_turma: z
    .string()
    .optional()
    .openapi({ description: 'Código da turma na UFABC' }),
  subjectId: z.coerce
    .string()
    .optional()
    .openapi({ description: 'Id interno' }),
});

export type NonPaginatedComponents = z.infer<
  typeof NonPaginatedComponentsSchema
>;

export const listComponentsSchema = {
  tags: ['Components'],
  querystring: z.object({
    season: z
      .string()
      .default(() => currentQuad())
      .refine(
        (val) => {
          const [year, quad] = val.split(':');

          if (!year || !quad) {
            return false;
          }

          return true;
        },
        { message: 'Season deve seguir o padrão ano:quadrimestre' }
      ),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: NonPaginatedComponentsSchema.array(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

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
    200: {
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const listTeacherComponents = {
  querystring: z.object({
    season: z.string(),
    subject: z.string().transform((val) => new Types.ObjectId(val)),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;
