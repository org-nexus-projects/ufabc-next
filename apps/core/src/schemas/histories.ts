import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';

import { z } from 'zod';

export const listCurrentSeasonCoursesSchema = {
  querystring: z.object({}).passthrough(),
} satisfies FastifyZodOpenApiSchema;
