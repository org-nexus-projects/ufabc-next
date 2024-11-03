import type { FastifySchema } from 'fastify';
import { z } from 'zod';
import 'zod-openapi/extend';

export const loginSchema = {
  querystring: z.object({
    inApp: z.coerce.boolean().default(false).openapi({
      description:
        'Váriavel legada que informava, se o acesso estava acontecendo pelo aplicativo',
      example: false,
    }),
    userId: z.string().default('').openapi({
      description:
        'Id interno do usuário, util para cadastrar um segundo método de autenticação para o usuário',
    }),
  }),
  tags: ['Login'],
} satisfies FastifySchema;
