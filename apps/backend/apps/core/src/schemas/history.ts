import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';
import { z } from 'zod';

const SIG_SITUATIONS = [
  'APROVADO',
  'REPROVADO',
  'REPROVADO POR FALTAS',
  '--',
  '',
  'CANCELADO',
] as const;

const SIG_RESULTS = ['A', 'B', 'C', 'D', 'E', 'F', 'O', '--', '', '0'] as const;

const sigComponents = z.object({
  year: z.coerce.number(),
  period: z
    .enum(['1', '2', '3', 'QS'])
    .transform((p) => (p === 'QS' ? '3' : p)),
  UFCode: z.string(),
  category: z.enum(['mandatory', 'free', 'limited']),
  status: z.enum(SIG_SITUATIONS).transform((situation) => {
    if (situation.length === 0 || situation === '--') {
      return null;
    }

    if (situation === 'CANCELADO') {
      return 'Trt. Total';
    }

    return situation.toLowerCase();
  }),
  name: z.string().transform((name) => name.trim().toLocaleLowerCase()),
  grade: z.enum(SIG_RESULTS).transform((result) => {
    if (result.length === 0 || result === '--' || result === '0') {
      return null;
    }
    return result;
  }),
  credits: z.number().int(),
});

const sigHistoryBody = z.object({
  ra: z.coerce.number().openapi({
    description: 'RA do aluno na UFABC',
  }),
  course: z
    .string()
    .transform((c) => c.toLocaleLowerCase())
    .openapi({
      description: 'Curso do aluno',
      example: 'bacharelado em ciencia e tecnologia',
    }),
  grade: z.string(),
  components: sigComponents
    .array()
    .openapi({ description: 'Histórico do Sigaa do estudante' }),
});

export type SigHistory = z.infer<typeof sigHistoryBody>;

export const sigHistorySchema = {
  tags: ['Sigaa'],
  body: sigHistoryBody,
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            msg: z.string(),
          }),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const studentHistorySchema = {
  tags: ['Sigaa'],
  querystring: z.object({
    ra: z.coerce.number(),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            curso: z.string(),
            grade: z.string().nullish(),
            ra: z.coerce.number(),
          }),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;
