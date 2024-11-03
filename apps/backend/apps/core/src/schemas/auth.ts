import { z } from 'zod';
import { Types } from 'mongoose';

export const SessionUserSchema = z.object({
  id: z.string().refine((val) => Types.ObjectId.isValid(val)),
  email: z.string().email(),
  ra: z.number(),
  oauth: z.object({}).passthrough(),
  confirmed: z.boolean(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  roles: z.string().array(),
});

export type Auth = z.infer<typeof SessionUserSchema>;
