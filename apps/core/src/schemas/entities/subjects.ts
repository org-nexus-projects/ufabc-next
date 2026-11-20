import type { FastifySchema } from 'fastify';
import { camelCase, startCase } from 'lodash-es';
import { Types } from 'mongoose';
import { z } from 'zod';

export const searchSubjectSchema = {
  querystring: z.object({
    q: z
      .string()
      .transform((str) => startCase(camelCase(str)))
      .transform((str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')),
  }),
  response: {
    200: z.object({
      total: z.number().int(),
      data: z
        .object({
          _id: z.coerce.string(),
          name: z.string(),
          search: z.string().nullable(),
          creditos: z.number().int().nullish(),
        })
        .array(),
    }),
  },
} satisfies FastifySchema;

export const subjectReviewsSchema = {
  tags: ['subjects'],
  params: z.object({
    subjectId: z.string().transform((str) => new Types.ObjectId(str)),
  }),
} satisfies FastifySchema;
