import { Types } from 'mongoose';
import { z } from 'zod';

const objectIdSchema = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id',
  });

const archiveSourceSchema = z.enum(['moodle', 'manual', 'sigaa', 'cmcc']);
const archiveStatusSchema = z.enum([
  'created',
  'downloaded',
  'stored',
  'failed',
  'deleted',
]);

export const archiveListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().trim().min(1).max(100).optional(),
  source: archiveSourceSchema.optional(),
  status: archiveStatusSchema.optional(),
});

export const archiveParamsSchema = z.object({ archiveId: objectIdSchema });
export const planParamsSchema = z.object({ componentId: objectIdSchema });

const archiveResponseSchema = z.object({
  _id: z.string(),
  component: z
    .object({
      _id: z.string(),
      code: z.string(),
      group: z.string(),
      name: z.string(),
      season: z.string(),
      shift: z.enum(['day', 'night']),
    })
    .nullable(),
  fileName: z.string().nullable(),
  source: archiveSourceSchema,
  status: archiveStatusSchema,
});

export const archiveListResponseSchema = z.object({
  data: z.array(archiveResponseSchema),
  limit: z.number(),
  page: z.number(),
  total: z.number(),
});

export const archiveDownloadResponseSchema = z.object({
  expiresInSeconds: z.number(),
  fileName: z.string().nullable(),
  url: z.string().url(),
});

export const componentPlanResponseSchema = z.object({
  planning: z
    .object({
      assessment: z.string(),
      methodology: z.string(),
      objectives: z.string(),
      syllabus: z.string(),
    })
    .nullable(),
  schedule: z.array(z.object({ date: z.string(), lesson: z.string() })),
  timetable: z.array(z.string()),
});
