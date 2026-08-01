import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';

import { Types } from 'mongoose';
import { z } from 'zod';

const tags = ['Comments'];

export const missingCommentsSchema = {
  tags,
  params: z.object({
    userId: z.string().transform((value) => new Types.ObjectId(value)),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const createCommentSchema = {
  tags,
  body: z.object({
    enrollment: z.string(),
    comment: z.string(),
    type: z.union([z.literal('teoria'), z.literal('pratica')]),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const updateCommentSchema = {
  tags,
  body: z.object({
    comment: z.string(),
  }),
  params: z.object({
    commentId: z.string().transform((val) => new Types.ObjectId(val)),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const deleteCommentSchema = {
  tags,
  params: z.object({
    commentId: z.string().transform((val) => new Types.ObjectId(val)),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const commentsOnTeacherSchema = {
  tags,
  params: z.object({
    teacherId: z.string().transform((val) => new Types.ObjectId(val)),
    subjectId: z
      .string()
      .optional()
      .transform((val) => (val ? new Types.ObjectId(val) : null)),
  }),
  querystring: z.object({
    limit: z.coerce.number().int().default(10),
    page: z.coerce.number().int().default(0),
  }),
} satisfies FastifyZodOpenApiSchema;

export const createReactionSchema = {
  tags,
  params: z.object({
    commentId: z.string().transform((val) => new Types.ObjectId(val)),
  }),
  body: z.object({
    kind: z.enum(['like', 'recommendation', 'star']),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;

export const deleteReactionSchema = {
  tags,
  params: z.object({
    commentId: z.string().transform((val) => new Types.ObjectId(val)),
    kind: z.enum(['like', 'recommendation', 'star']),
  }),
  body: z.object({
    kind: z.enum(['like', 'recommendation', 'star']),
  }),
  response: {
    200: {
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
    },
  },
} satisfies FastifyZodOpenApiSchema;
