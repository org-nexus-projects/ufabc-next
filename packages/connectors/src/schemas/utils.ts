import { z } from 'zod';

export function pageableReturnSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    page: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  });
}
