import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';

import { z } from 'zod';

const tags = ['Students'];

const updatedStudentSchema = z.object({
  ra: z.number().nullable(),
  studentId: z.number().nullish(),
  graduations: z.any().array(),
});

export type UpdatedStudent = z.infer<typeof updatedStudentSchema>;

export const updateStudentSchema = {
  tags,
  body: z.object({
    ra: z.coerce.number().nullable().openapi({
      example: 112222332,
    }),
    login: z.string().openapi({
      example: 'john.doe',
    }),
    studentId: z.number().int().optional(),
    graduationId: z.number().int().optional(),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: updatedStudentSchema,
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;
