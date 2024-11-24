import { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { z } from "zod";

export const listStudentSchema = {
  tags: ['Students'],
  response: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            studentId: z.number().int(),
            login: z.string(),
          })
        }
      }
    }
  }
} satisfies FastifyZodOpenApiSchema