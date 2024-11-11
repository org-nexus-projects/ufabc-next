import { Schema, z } from 'zod';
import { Types } from 'mongoose';
import 'zod-openapi/extend';
import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';

const OauthSchema = z.object({
  google: z
    .string()
    .optional()
    .openapi({
      description: 'Id do usuário recebido após login Oauth2',
    })
    .optional(),
  emailGoogle: z
    .string()
    .email()
    .openapi({
      description: 'E-mail escolhido pelo usuário na tela de oauth',
    })
    .optional(),
  email: z
    .string()
    .email()
    .openapi({
      description: 'Mesmo caso do emailGoogle/Facebook',
    })
    .optional(),
  facebook: z
    .string()
    .optional()
    .openapi({ description: 'Id do usuário recebido após login Oauth2' }),
  emailFacebook: z
    .string()
    .email()
    .openapi({
      description: 'E-mail escolhido pelo usuário na tela de oauth',
    })
    .optional(),
});

export const SessionUserSchema = z.object({
  studentId: z.string().refine((val) => Types.ObjectId.isValid(val)),
  ra: z.number().optional(),
  email: z.string().email().optional(),
  oauth: z.any().default(OauthSchema),
  permissions: z.string().array().default([]),
  createdAt: z.date(),
  active: z.boolean().openapi({ description: 'Estado da conta do usuário' }),
  confirmed: z.boolean().openapi({ description: 'Usuário ativou a conta' }),
});

export const userAuthSchema = {
  tags: ['User'],
  response: {
    200: {
      content: {
        'application/json': {
          schema: SessionUserSchema,
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const completeUserSchema = {
  body: z.object({
    ra: z.coerce.number(),
    email: z
      .string()
      .email()
      .refine((val) => val.includes('@aluno.ufabc.edu.br'), {
        message: 'Invalid UFABC email',
      }),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            ra: z.number(),
            email: z.string().email(),
          }),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export type Auth = z.infer<typeof SessionUserSchema>;
