import { z } from 'zod';

export const componentArchiveSchema = z
  .object({
    viewurl: z.string().url(),
    fullname: z.string(),
    id: z.number(),
  })
  .array();

export type ComponentArchive = z.infer<typeof componentArchiveSchema>;
