import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';

import { z } from 'zod';

export const teacherSummarySchema = {
  tags: ['Teachers'],
  params: z.object({
    teacherId: z.string(),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            teacher: z.coerce.string(),
            summary: z.string(),
            didacticQuality: z.boolean().nullish(),
            takesAttendance: z.boolean().nullish(),
            usesSigaa: z.boolean().nullish(),
            usesMoodle: z.boolean().nullish(),
            commentsCount: z.number().int(),
            oldestComment: z.coerce.date(),
            newestComment: z.coerce.date(),
            promptVersion: z.string(),
            updatedAt: z.coerce.date(),
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
