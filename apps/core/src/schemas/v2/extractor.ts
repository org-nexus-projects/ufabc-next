import { z } from 'zod';

export const extractionSchema = z.object({
  planning: z.object({
    assessment: z.string(),
    methodology: z.string(),
    objectives: z.string(),
    syllabus: z.string(),
  }),
  schedule: z.object({ date: z.string(), lesson: z.string() }).array(),
});

export const summarySchema = z.object({
  didactic_quality: z.number().min(0).max(5).nullable(),
  model: z.string(),
  prompt_version: z.string(),
  summary: z.string(),
  takes_attendance: z.boolean().nullable(),
  uses_moodle: z.boolean().nullable(),
  uses_sigaa: z.boolean().nullable(),
});

export type ArchiveExtraction = z.infer<typeof extractionSchema>;
export type CommentsSummary = z.infer<typeof summarySchema>;
