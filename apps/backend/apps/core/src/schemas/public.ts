import { currentQuad } from '@next/common';
import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';
import { z } from 'zod';

const graduationsListSchema = z.object({
  curso: z.string(),
  grade: z.string(),
  credits_total: z.number().int().nullable(),
  free_credits_number: z.number().int().nullable(),
  limited_credits_number: z.number().int().nullable(),
  mandatory_credits_number: z.number().int().nullable(),
});

export type GraduationList = z.infer<typeof graduationsListSchema>;

export const listGraduationsSchema = {
  response: {
    200: {
      content: {
        'application/json': {
          schema: graduationsListSchema.array(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const listStudentStats = {
  querystring: z.object({ season: z.string().default(currentQuad()) }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z
            .object({
              students_number: z.number().int(),
              components_number: z.number().int(),
            })
            .array(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;
