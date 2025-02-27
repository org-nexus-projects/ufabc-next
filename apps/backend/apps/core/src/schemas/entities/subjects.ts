import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';
import { camelCase, startCase } from 'lodash-es';
import { Types } from 'mongoose';
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

export const searchSubjectSchema = {
  querystring: z.object({
    q: z
      .string()
      .transform((str) => startCase(camelCase(str)))
      .transform((str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            total: z.number().int(),
            data: z
              .object({
                _id: z.coerce.string(),
                name: z.string(),
                search: z.string().nullable(),
                creditos: z.number().int().nullable(),
              })
              .array(),
          }),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const subjectReviewsSchema = {
  tags: ['subjects'],
  params: z.object({
    subjectId: z.string().transform((str) => new Types.ObjectId(str)),
  }),
} satisfies FastifyZodOpenApiSchema;
