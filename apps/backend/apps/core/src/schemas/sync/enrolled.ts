import { currentQuad } from '@next/common';
import { z } from 'zod';
import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';

export const syncEnrolledSchema = {
  querystring: z.object({
    season: z.string().default(currentQuad()),
  }),
  body: z.object({
    operation: z.union([z.literal('after_kick'), z.literal('before_kick')]),
  }),
} satisfies FastifyZodOpenApiSchema;
