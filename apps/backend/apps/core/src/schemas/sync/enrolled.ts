import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';

import { currentQuad } from '@next/common';
import { z } from 'zod';

export const syncEnrolledSchema = {
  querystring: z.object({
    season: z.string().default(currentQuad()),
  }),
  body: z.object({
    operation: z.union([z.literal('after_kick'), z.literal('before_kick')]),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.string(),
            time: z.number(),
            componentsProcessed: z.number(),
          }),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;
