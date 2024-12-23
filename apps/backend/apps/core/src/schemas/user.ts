import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';
import { z } from 'zod';

export const deactivateUserSchema = {
  tags: ['User'],
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({
              description: 'Mensagem de despedida',
              example: 'Foi bom te ter aqui =)',
            }),
          }),
        },
      },
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const resendEmailSchema = {
  tags: ['User'],
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({ example: 'E-mail enviado' }),
          }),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const loginFacebookSchema = {
  body: z.object({
    ra: z.number(),
    email: z.string().email(),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string().optional(),
            token: z.string(),
          }),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const confirmUserSchema = {
  body: z.object({
    token: z.string(),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            token: z.string(),
          }),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;
