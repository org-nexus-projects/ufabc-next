import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';
import { z } from 'zod';

const paginatedSubjectsSchema = z.object({
  total: z.number().int(),
  pages: z.number().int(),
  data: z
    .object({
      name: z.string(),
      credits: z.number().int().optional(),
    })
    .array(),
});

export type PaginatedSubject = z.infer<typeof paginatedSubjectsSchema>;

export const listSubjectsSchema = {
  querystring: z.object({
    limit: z.coerce.number().int().default(10),
    page: z.coerce.number().int().default(1),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: paginatedSubjectsSchema,
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;
