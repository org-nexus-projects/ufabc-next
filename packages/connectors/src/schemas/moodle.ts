import { z } from 'zod';

export const moodleComponentDataSchema = z.object({
  coursecategory: z.string(),
  courseimage: z.string(),
  enddate: z.number(),
  fullname: z.string(),
  fullnamedisplay: z.string(),
  hasprogress: z.boolean(),
  hidden: z.number(),
  id: z.number(),
  idnumber: z.string(),
  isfavourite: z.boolean(),
  progress: z.number(),
  shortname: z.string(),
  showactivitydates: z.boolean(),
  showcompletionconditions: z.boolean().nullable(),
  showshortname: z.boolean(),
  startdate: z.number(),
  summary: z.string(),
  summaryformat: z.string(),
  viewurl: z.string(),
  visible: z.boolean(),
});

export const moodleResponseSchema = z.object({
  data: z.record(z.unknown()),
  error: z.boolean(),
  exception: z.record(z.unknown()).optional(),
});

export const moodleComponentSchema = z.object({
  data: z.object({
    courses: z.array(moodleComponentDataSchema),
    nextoffset: z.number(),
  }),
  error: z.boolean(),
});

export type MoodleComponent = z.infer<typeof moodleComponentSchema>;
export type MoodleResponse = z.infer<typeof moodleResponseSchema>;
