import { defineJob } from '@next/queues/client';
import { JOB_NAMES } from '@/constants.js';
import z from 'zod';

const componentSchema = z.object({
  viewurl: z.string().url(),
  fullname: z.string(),
  id: z.number(),
});

export type ComponentArchiveJobData = {
  component: z.infer<typeof componentSchema>;
  globalTraceId?: string;
};

export const componentsArchivesProcessingJob = defineJob<
  typeof JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING,
  ComponentArchiveJobData,
  { success: boolean; message: string; globalTraceId?: string }
>(JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING)
  .input(
    z.object({
      component: componentSchema,
      globalTraceId: z.string().optional(),
    }),
  )
  .concurrency(5)
  .handler(async ({ job }) => {
    return {
      success: true,
      message: 'hi its working!',
      globalTraceId: job.data.globalTraceId,
    };
  });
