import { currentQuad } from '@next/common';
import { z } from 'zod';
import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';

const tags = ['Students'];

const listMatriculaStudentSchema = z.object({
  studentId: z.number().int(),
  graduations: z
    .object({
      courseId: z.number().int(),
      name: z.string(),
      cp: z.number().optional(),
      cr: z.number().optional(),
      ca: z.number().optional(),
      affinity: z.number().optional(),
      shift: z.enum(['noturno', 'matutino', 'Noturno', 'Matutino', 'Diurno']),
    })
    .array(),
});

export type MatriculaStudent = z.infer<typeof listMatriculaStudentSchema>;

export const listStudentsStatsComponents = {
  tags,
  querystring: z.object({
    season: z.string().default(currentQuad()),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z
            .object({
              studentsNumber: z.number().int(),
              componentsNumber: z.number().int(),
            })
            .array(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const listStudentSchema = {
  tags,
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            studentId: z.number().int(),
            login: z.string(),
          }),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const createStudentSchema = {
  tags,
  body: z.object({
    studentId: z.number().int(),
    ra: z.number(),
    login: z.string(),
    graduations: z
      .object({
        courseId: z.number().int().array(),
        name: z.string(),
        cp: z.number().optional(),
        cr: z.number().optional(),
        ind_afinidade: z.number().optional(),
        quads: z.number().optional(),
      })
      .array(),
  }),
} satisfies FastifyZodOpenApiSchema;

export const listMatriculaStudent = {
  querystring: z.object({
    ra: z.coerce.number(),
    login: z.string(),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: listMatriculaStudentSchema,
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;
