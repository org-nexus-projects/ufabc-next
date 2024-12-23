import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';
import { z } from 'zod';

const enrollmentsListSchema = z.object({
  _id: z.coerce.string(),
  disciplina: z.string(),
  quad: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  year: z.number(),
  ca_acumulado: z.number().nullish(),
  cr_acumulado: z.number().nullish(),
  cp_acumulado: z.number().nullish(),
  comments: z.string().array().optional(),
  conceito: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  creditos: z.number().int(),
  identifier: z.string(),
  season: z.string().optional(),
  subject: z.object({
    _id: z.coerce.string(),
    name: z.string(),
    search: z.string(),
    creditos: z.number(),
  }),
  teoria: z
    .object({
      _id: z.coerce.string(),
      name: z.string(),
      alias: z.string().array().nullish(),
    })
    .optional(),
  pratica: z
    .object({
      _id: z.coerce.string(),
      name: z.string(),
      alias: z.string().array().nullish(),
    })
    .optional(),
});

export type EnrollmentsList = z.infer<typeof enrollmentsListSchema>;

export const listUserEnrollments = {
  response: {
    200: {
      content: {
        'application/json': {
          schema: enrollmentsListSchema.array(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;
