import { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';
import { z } from 'zod';

export const helpFormSchema = {
  tags: ['help'],
  body: z.object({
    email: z.string().email(),
    ra: z.string(),
    problemTitle: z
      .string()
      .max(120)
      .openapi({ description: 'pequeno titulo explicando o problema' }),
    problemDescription: z
      .string()
      .max(5000)
      .openapi({ description: 'descrição do problema' }),
  }),
} satisfies FastifyZodOpenApiSchema;
