import { currentQuad } from '@next/common';
import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';
import { z } from 'zod';

const graduationsListSchema = z.object({
  curso: z.string(),
  grade: z.string(),
  credits_total: z.number().int().nullish(),
  free_credits_number: z.number().int().nullish(),
  limited_credits_number: z.number().int().nullish(),
  mandatory_credits_number: z.number().int().nullish(),
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

export const listComponentsResume = {
  params: z.object({
    action: z
      .union([
        z.literal('overview'),
        z.literal('component'),
        z.literal('courses'),
      ])
      .optional(),
  }),
  querystring: z.object({
    season: z.string().optional().default(currentQuad()),
    turno: z.string().optional(),
    courseId: z.coerce.number().int().optional(),
    ratio: z.coerce.number().optional(),
    limit: z.coerce.number().optional().default(10),
    page: z.coerce.number().optional().default(0),
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
