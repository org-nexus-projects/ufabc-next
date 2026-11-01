import { Types } from 'mongoose';
import { z } from 'zod';

import {
  COMPONENT_ARCHIVE_SOURCES,
  COMPONENT_ARCHIVE_STATUS,
} from '@/models/ComponentArchive.js';

export const objectIdSchema = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id',
  });

const archiveSourceSchema = z.enum(COMPONENT_ARCHIVE_SOURCES);
const archiveStatusSchema = z.enum(COMPONENT_ARCHIVE_STATUS);

export const archiveListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().trim().min(1).max(100).optional(),
  source: archiveSourceSchema.optional(),
  status: archiveStatusSchema.optional(),
});

export type ArchiveListQuery = z.infer<typeof archiveListQuerySchema>;

export const archiveParamsSchema = z.object({ archiveId: objectIdSchema });

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
