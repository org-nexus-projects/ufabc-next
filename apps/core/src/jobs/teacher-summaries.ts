import { defineJob } from '@next/queues/client';
import z from 'zod';

import { JOB_NAMES } from '@/constants.js';
import { SummaryGenerationService } from '@/services/summary-generation-service.js';

export const teacherCommentCreatedJob = defineJob(
  JOB_NAMES.TEACHER_COMMENT_CREATED
)
  .input(z.object({ teacherId: z.string() }))
  .concurrency(5)
  .handler(async ({ job, app }) => {
    const { teacherId } = job.data;
    const service = new SummaryGenerationService({ config: app.config });

    const shouldSummarize = await service.hasEnoughNewComments(teacherId);
    if (!shouldSummarize) {
      return { dispatched: false, teacherId };
    }

    await app.manager.dispatch(JOB_NAMES.TEACHER_SUMMARY, { teacherId });
    return { dispatched: true, teacherId };
  });

export const teacherSummaryJob = defineJob(JOB_NAMES.TEACHER_SUMMARY)
  .input(z.object({ teacherId: z.string() }))
  .concurrency(1)
  .handler(async ({ job, app }) => {
    const service = new SummaryGenerationService({ config: app.config });

    return await service.generateSummary(job.data.teacherId);
  });
