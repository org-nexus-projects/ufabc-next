import { defineJob } from '@next/queues/client';
import type { FastifyInstance } from 'fastify';

export const testJob = defineJob('test_job').handler(async ({ job, app }) => {
  return {
    success: true,
    message: 'hi its working!',
    globalTraceId: job.data.globalTraceId,
  };
});

export async function registerJobs(app: FastifyInstance): Promise<void> {
  app.manager.register(testJob);
  await app.manager.start();
  // Setup board after jobs are registered and started
  await app.manager.board();
}
