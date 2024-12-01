import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { Types } from "mongoose";
import { z } from "zod";

const tags = ['Comments']

export const missingCommentsSchema = {
  tags,
  params: z.object({
    userId: z.string().transform(value => new Types.ObjectId(value)),
  }),
  response: {
    200: {
      content: {
        "application/json": {
          schema: z.any(),
        }
      }
    }
  }
} satisfies FastifyZodOpenApiSchema

export const createCommentSchema = {
  body: z.object({
    enrollment: z.string(),
    comment: z.string(),
    type: z.union([z.literal('teoria'), z.literal('pratica')])
  }),
  response: {
    200: {
      content: {
        "application/json": {
          schema: z.any(),
        }
      }
    }
  }
} satisfies FastifyZodOpenApiSchema

export const updateCommentSchema = {
  body: z.object({
   comment: z.string(),
  }),
  params: z.object({
    commentId: z.string(),
  }),
  response: {
    200: {
      content: {
        "application/json": {
          schema: z.any(),
        }
      }
    }
  } 
} satisfies FastifyZodOpenApiSchema

export const deleteCommentSchema = {
  params: z.object({
    commentId: z.string(),
  }),
  response: {
    200: {
      content: {
        "application/json": {
          schema: z.any(),
        }
      }
    }
  } 
} satisfies FastifyZodOpenApiSchema
