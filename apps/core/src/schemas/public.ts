import { currentQuad } from '@next/utils';
import type { FastifySchema } from 'fastify';
import { z } from 'zod';

export const listComponentsResume = {
  params: z.object({
    action: z
      .union([
        z.literal('overview'),
        z.literal('component'),
        z.literal('courses'),
      ])
      .optional(),
  }),
  querystring: z.object({
    season: z.string().optional().default(currentQuad()),
    turno: z.enum(['diurno', 'noturno']).optional(),
    courseId: z.coerce.number().int().optional(),
    ratio: z.coerce.number().optional(),
    limit: z.coerce.number().optional().default(10),
    page: z.coerce.number().optional().default(0),
  }),
  response: {
    200: z.any(),
  },
} satisfies FastifySchema;
