import { logger } from '@next/common';
import { sendEmailWorker } from './jobs/confirmationEmail.js';
import { createWorker } from './utils/queue.js';

export const emailWorker = createWorker('Send:Email', sendEmailWorker);

emailWorker.on('completed', (job) => {
  logger.info({
    msg: `[QUEUE] Job ${job.queueName} completed`,
    id: job.id,
    data: job.data,
  });
});
