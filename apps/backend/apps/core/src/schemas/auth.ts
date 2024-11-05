import { z } from 'zod';
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
  studentEmail: z.string().email().optional(),
  ra: z.number().optional(),
  oauth: OauthSchema.passthrough(),
  permissions: z.string().array().default([]),
  createdAt: z.string(),
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

export type Auth = z.infer<typeof SessionUserSchema>;
