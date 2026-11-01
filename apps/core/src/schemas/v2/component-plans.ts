import { z } from 'zod';

import { objectIdSchema } from './archives.js';

export const planParamsSchema = z.object({ componentId: objectIdSchema });

export const componentPlanResponseSchema = z.object({
  planning: z
    .object({
      assessment: z.string(),
      methodology: z.string(),
      objectives: z.string(),
      syllabus: z.string(),
    })
    .nullable(),
  schedule: z.array(z.object({ date: z.string(), lesson: z.string() })),
  timetable: z.array(z.string()),
});
