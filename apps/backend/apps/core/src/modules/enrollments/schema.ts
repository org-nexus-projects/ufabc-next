import { z } from 'zod';
import type { FastifySchema } from 'fastify';
import type { ObjectId } from 'mongoose';

const subjectSchema = z.object({
  _id: z.custom<ObjectId>(),
  name: z.string(),
  search: z.string(),
  creditos: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  __v: z.number().optional(),
});

const teoriaSchema = z.object({
  _id: z.custom<ObjectId>(),
  name: z.string(),
  alias: z.string().array(),
  createdAt: z.date(),
  updatedAt: z.date(),
  __v: z.number().optional(),
});

const listEnrollmentsResponse = z
  .object({
    _id: z.custom<ObjectId>(),
    year: z.number(),
    quad: z.number(),
    identifier: z.string(),
    ra: z.number(),
    disciplina: z.string(),
    subject: subjectSchema,
    campus: z.string(),
    turno: z.string(),
    turma: z.string(),
    teoria: teoriaSchema.optional(),
    pratica: teoriaSchema.optional(),
    mainTeacher: z.custom<ObjectId>().optional(),
    comments: z.string().array().optional(),
    conceito: z.string(),
    creditos: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
    __v: z.number().optional(),
  })
  .array()
  .describe('Modelo das matérias que temos registradas');

const enrollmentResponse = z
  .object({
    enrollment: z.object({
      _id: z.custom<ObjectId>(),
      year: z.number(),
      quad: z.number(),
      identifier: z.string(),
      ra: z.number(),
      disciplina: z.string(),
      subject: subjectSchema,
      campus: z.string(),
      turno: z.string(),
      turma: z.string(),
      teoria: teoriaSchema.optional(),
      pratica: teoriaSchema.optional(),
      mainTeacher: z.custom<ObjectId>().optional(),
      comments: z.array(z.nullable(z.string())).optional(),
      conceito: z.string(),
      creditos: z.number(),
      createdAt: z.date(),
      updatedAt: z.date(),
      __v: z.number().optional(),
    }),
    comments: z.string().array().nullable(),
  })
  .describe('Modelo das matérias que temos registradas');

/** User enrollments */
export const listEnrollmentsSchema = {
  tags: ['Enrollments'],
  description: 'Rota que retorna um array de matérias que o aluno cursou',
  response: {
    200: listEnrollmentsResponse,
  },
} satisfies FastifySchema;

/**Enrollment  */
export const enrollmentSchema = {
  tags: ['Enrollments'],
  description: 'Rota que retorna uma matéria que o aluno cursou',
  response: {
    200: enrollmentResponse,
  },
} satisfies FastifySchema;
