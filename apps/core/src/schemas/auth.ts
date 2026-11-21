import type { FastifySchema } from 'fastify';
import { Types } from 'mongoose';
import { z } from 'zod';

const OauthSchema = z.object({
  google: z
    .string()
    .optional()
    .meta({
      description: 'Id do usuário recebido após login Oauth2',
    })
    .optional(),
  emailGoogle: z
    .string()
    .email()
    .meta({
      description: 'E-mail escolhido pelo usuário na tela de oauth',
    })
    .optional(),
  email: z
    .string()
    .email()
    .meta({
      description: 'Mesmo caso do emailGoogle/Facebook',
    })
    .optional(),
  facebook: z
    .string()
    .optional()
    .meta({ description: 'Id do usuário recebido após login Oauth2' }),
  emailFacebook: z
    .string()
    .email()
    .meta({
      description: 'E-mail escolhido pelo usuário na tela de oauth',
    })
    .optional(),
});

export const SessionUserSchema = z.object({
  _id: z.string().refine((val) => Types.ObjectId.isValid(val)),
  ra: z.number().optional().nullable(),
  email: z.string().email().nullish(),
  oauth: z.any().default(OauthSchema),
  permissions: z.string().array().default([]),
  createdAt: z.date(),
  active: z.boolean().meta({ description: 'Estado da conta do usuário' }),
  confirmed: z.boolean().meta({ description: 'Usuário ativou a conta' }),
});

export const userAuthSchema = {
  tags: ['User'],
  response: {
    200: SessionUserSchema,
  },
} satisfies FastifySchema;

export const completeUserSchema = {
  body: z.object({
    ra: z.any(),
    email: z.string().email(),
  }),
  response: {
    200: z
      .object({
        ra: z.number(),
        email: z.string().email(),
      })
      .or(
        z.object({
          token: z.string(),
        })
      ),
  },
} satisfies FastifySchema;

export type Auth = z.infer<typeof SessionUserSchema>;
