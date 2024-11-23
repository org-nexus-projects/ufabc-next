import { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { z } from "zod";

export const listTeachersSchema = {
  tags: ['Teachers'],
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().openapi({ description: 'Nome do professor, pode vir minusculo ou em Title Case', example: 'John Doe / john doe' }),
            alias: z.string().array().openapi({ description: 'Outros nomes pelo qual o professor ja pode ter aparecido', example: 'Johnzinho doe' })
          }).array(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const createTeachersSchema = {
  body: z.object({
    names: z.string().array(),
  })
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
            name: z.string().openapi({ description: 'Nome do professor em que a atualização foi aplicada', example: 'John Doe / john doe' }),
            alias: z.string().array().openapi({ description: 'Alias com sua alteração' })
          }).nullable(),
        },
      },
    },
  }
} satisfies FastifyZodOpenApiSchema;
