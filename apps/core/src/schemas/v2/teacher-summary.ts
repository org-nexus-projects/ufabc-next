import { z } from 'zod';

export const teacherSummaryParamsSchema = z.object({
  teacherId: z.string(),
});

export const teacherSummaryResponseSchema = z.object({
  teacher: z.coerce.string(),
  summary: z.string(),
  didacticQuality: z.number().min(0).max(5).nullish(),
  takesAttendance: z.boolean().nullish(),
  usesSigaa: z.boolean().nullish(),
  usesMoodle: z.boolean().nullish(),
  commentsCount: z.number().int(),
  oldestComment: z.coerce.date(),
  newestComment: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
