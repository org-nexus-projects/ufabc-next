import { defineJob } from '@next/queues/client';
import { JOB_NAMES } from '@/constants.js';

export const componentsArchivesProcessingJob = defineJob(
  JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING,
).handler(async ({ job, app }) => {
  return {
    success: true,
    message: 'hi its working!',
    globalTraceId: job.data.globalTraceId,
  };
});
