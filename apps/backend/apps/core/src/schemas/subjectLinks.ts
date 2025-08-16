import { z } from 'zod';

export const pdfSchema = z.object({
  pdfLink: z.string().url(),
  pdfName: z.string().min(1),
});

export const subjectMoodleLinkSchema = z.object({
  id: z.number(),
  fullname: z.string(),
});

export const apiResponseSchema = z.object({
  error: z.union([
    z.object({ message: z.string() }),
    z.literal(false)
  ]).optional(),
  data: z.object({
    courses: z.array(subjectMoodleLinkSchema),
  }).optional(),
});

export type PdfItem = z.infer<typeof pdfSchema>;

export type SubjectMoodleLink = z.infer<typeof subjectMoodleLinkSchema> & {
  link?: string;
};