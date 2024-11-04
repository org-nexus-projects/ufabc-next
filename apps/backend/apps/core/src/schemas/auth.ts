import { z } from 'zod';
import { Types, type ObjectId } from 'mongoose';

export const SessionUserSchema = z.object({
  _id: z.string().refine((val) => Types.ObjectId.isValid(val)),
  email: z.string().email(),
  ra: z.number(),
  oauth: z.object({}).passthrough(),
  confirmed: z.boolean(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  permissions: z.string().array(),
});

export type Auth = z.infer<typeof SessionUserSchema>;
