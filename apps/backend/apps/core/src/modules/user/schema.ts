import { z } from 'zod';
import { UfabcUser } from './sign-up-schema.js';
import type { FastifySchema } from 'fastify';
import type { ObjectId } from 'mongoose';

const oauthSchema = z
  .object({
    email: z.string(),
    provider: z.enum(['facebook', 'google']),
    providerId: z.string(),
  })
  .describe('Informações que recebemos do método de login oauth');

const devicesSchema = z.object({
  deviceId: z.string(),
  token: z.string(),
  phone: z.string(),
});

const usersInfoResponse = z
  .object({
    oauth: oauthSchema,
    _id: z.custom<ObjectId>(),
    confirmed: z.boolean(),
    active: z.boolean(),
    permissions: z.array(z.string()).optional(),
    devices: devicesSchema.array().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    __v: z.number(),
    email: z.string().email().optional(),
    ra: z.number().optional(),
  })
  .describe('Informações do usuário da sessão');

/** Logged User */
export const usersInfoSchema = {
  tags: ['Users'],
  description: 'Rotas para criação e manipulação da conta de um Usuário',
  response: {
    200: usersInfoResponse,
  },
} satisfies FastifySchema;

/** Resend email */
export const resendEmailSchema = {
  tags: ['Users'],
  description: 'Rota para re-enviar e-mail em caso de não recebimento',
} satisfies FastifySchema;

/** Confirm User */
export const confirmUserSchema = {
  tags: ['Users'],
  description:
    'Rota que garante que o usuário conseguiu se cadastrar com oauth e assim realizar o envio de e-mail',
  response: {
    200: z.object({
      token: z.string().describe('Token da sessão do usuário'),
    }),
  },
} satisfies FastifySchema;

/**Complete user */
export const completeUserSchema = {
  tags: ['Users'],
  description:
    'Rota que finaliza o cadastro do usuário após o mesmo criar no link de confirmação do e-mail',
  response: {
    200: UfabcUser,
  },
} satisfies FastifySchema;
