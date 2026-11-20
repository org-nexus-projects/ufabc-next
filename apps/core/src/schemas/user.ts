import type { FastifySchema } from 'fastify';
import { z } from 'zod';

const tags = ['User'];

export const deactivateUserSchema = {
  tags,
  response: {
    200: z.object({
      message: z.string().meta({
        description: 'Mensagem de despedida',
        example: 'Foi bom te ter aqui =)',
      }),
    }),
    404: z.object({
      message: z.string(),
    }),
  },
} satisfies FastifySchema;

export const resendEmailSchema = {
  tags,
  response: {
    200: z.object({
      message: z.string().meta({ example: 'E-mail enviado' }),
    }),
  },
} satisfies FastifySchema;

export const confirmUserSchema = {
  body: z.object({
    token: z.string(),
  }),
  response: {
    200: z.object({
      token: z.string(),
    }),
  },
} satisfies FastifySchema;

export const validateUserEmailSchema = {
  tags,
  querystring: z.object({
    ra: z
      .string()
      .regex(/^\d{1,15}$/)
      .describe('Student ID (RA) of the user to validate'),
  }),
  response: {
    400: z.object({
      message: z
        .string()
        .describe(
          'Error message when the user does not exist or is an UFABC employee'
        ),
    }),
    200: z.object({
      email: z.string().describe('Valid email address of the user'),
    }),
  },
} satisfies FastifySchema;

export const sendRecoveryEmailSchema = {
  tags,
  body: z.object({
    email: z.string().email(),
  }),
} satisfies FastifySchema;
