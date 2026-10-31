import { Types } from 'mongoose';
import { z } from 'zod';

export const teacherSummaryParamsSchema = z.object({
  teacherId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid teacherId',
  }),
});

export const teacherSummaryResponseSchema = z.object({
  teacher: z.coerce.string(),
  summary: z.string(),
  didacticQuality: z.number().min(0).max(5).nullish(),
  takesAttendance: z.boolean().nullish(),
  usesSigaa: z.boolean().nullish(),
  usesMoodle: z.boolean().nullish(),
  commentsCount: z.number().int(),
});
