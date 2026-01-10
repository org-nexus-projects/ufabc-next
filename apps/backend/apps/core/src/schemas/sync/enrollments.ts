import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';

import { z } from 'zod';

export const syncEnrollmentsSchema = {
  body: z.object({
    season: z.string(),
    kind: z.enum(['settlement', 'resettlement']),
    hash: z.string().optional(),
  }),
} satisfies FastifyZodOpenApiSchema;
