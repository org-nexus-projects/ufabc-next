import { z } from 'zod';

export const moodleComponentDataSchema = z.object({
  id: z.number(),
  fullname: z.string(),
  shortname: z.string(),
  idnumber: z.string(),
  summary: z.string(),
  summaryformat: z.string(),
  startdate: z.number(),
  enddate: z.number(),
  visible: z.boolean(),
  showactivitydates: z.boolean(),
  showcompletionconditions: z.boolean().nullable(),
  fullnamedisplay: z.string(),
  viewurl: z.string(),
  courseimage: z.string(),
  progress: z.number(),
  hasprogress: z.boolean(),
  isfavourite: z.boolean(),
  hidden: z.number(),
  showshortname: z.boolean(),
  coursecategory: z.string(),
});

export const moodleResponseSchema = z.object({
  error: z.boolean(),
  exception: z.record(z.unknown()).optional(),
  data: z.record(z.unknown()),
});
export type MoodleResponse = z.infer<typeof moodleResponseSchema>;

export const moodleComponentSchema = z.object({
  error: z.boolean(),
  data: z.object({
    courses: z.array(moodleComponentDataSchema),
    nextoffset: z.number(),
  }),
});
export type MoodleComponent = z.infer<typeof moodleComponentSchema>;
