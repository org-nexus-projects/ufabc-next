import { z } from 'zod';

export const UfabcUser = z.object({
  email: z.string().email(),
  ra: z.number(),
});
export const ParsedUserToken = z.object({
  email: z.string().email(),
});

export type UfabcUser = z.infer<typeof UfabcUser>;
export type ParsedUserToken = z.infer<typeof ParsedUserToken>;
