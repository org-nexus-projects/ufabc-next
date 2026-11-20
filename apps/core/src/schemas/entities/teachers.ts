import type { FastifySchema } from 'fastify';
import { camelCase, startCase } from 'lodash-es';
import { z } from 'zod';

export const searchTeacherSchema = {
  querystring: z.object({
    q: z
      .string()
      .transform((str) => startCase(camelCase(str)))
      .transform((str) => str.replace(/[\s#$()*+,.?[\\\]^{|}-]/g, '\\$&')),
  }),
  response: {
    200: z.object({
      total: z.number().int(),
      data: z
        .object({
          _id: z.coerce.string(),
          name: z.string(),
          alias: z.string().array().nullish(),
        })
        .array(),
    }),
  },
} satisfies FastifySchema;
