import { currentQuad } from "@next/common";
import { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { z } from "zod";

export const listStudentsStatsComponents = {
  querystring: z.object({
    season: z.string().default(currentQuad()),
  }),
  response: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            studentsNumber: z.number().int(),
            componentsNumber: z.number().int(),
          }).array()
        }
      }
    }
  }
} satisfies FastifyZodOpenApiSchema