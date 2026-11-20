import type { FastifySchema } from 'fastify';
import { z } from 'zod';

const helpFormBodySchema = z.object({
  email: z.string().email(),
  ra: z.string(),
  problemTitle: z
    .string()
    .max(120)
    .meta({ description: 'pequeno titulo explicando o problema' }),
  problemDescription: z
    .string()
    .max(5000)
    .meta({ description: 'descrição do problema' }),
  imageBuffer: z.string().optional(),
  imageFilename: z.string().optional(),
  imageMimeType: z.string().optional(),
});

export const helpFormSchema = {
  tags: ['help'],
  body: helpFormBodySchema,
} satisfies FastifySchema;

export type HelpForm = z.infer<typeof helpFormBodySchema>;
