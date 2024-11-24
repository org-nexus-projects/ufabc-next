import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';
import { camelCase, startCase } from 'lodash-es';
import { z } from 'zod';

export const listTeachersSchema = {
  tags: ['Teachers'],
  response: {
    200: {
      content: {
        'application/json': {
          schema: z
            .object({
              name: z.string().openapi({
                description:
                  'Nome do professor, pode vir minusculo ou em Title Case',
                example: 'John Doe / john doe',
              }),
              alias: z.string().array().nullish().openapi({
                description:
                  'Outros nomes pelo qual o professor ja pode ter aparecido',
                example: ['Johnzinho doe'],
              })
            })
            .array(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const createTeachersSchema = {
  body: z.object({
    names: z.string().array(),
  }),
} satisfies FastifyZodOpenApiSchema;

export const updateTeacherSchema = {
  tags: ['Teachers'],
  body: z.object({ alias: z.string() }),
  params: z.object({
    teacherId: z.string(),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            total: z.number().int(),
            data: z
              .object({
                name: z.string(),
                alias: z.string().array().nullable(),
              })
              .array(),
          }),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const searchTeacherSchema = {
  querystring: z.object({
    q: z
      .string()
      .transform((str) => startCase(camelCase(str)))
      .transform((str) => str.replace(/[\s#$()*+,.?[\\\]^{|}-]/g, '\\$&')),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            total: z.number().int(),
            data: z
              .object({
                name: z.string(),
                alias: z.string().array().nullable(),
              })
              .array(),
          }),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;
