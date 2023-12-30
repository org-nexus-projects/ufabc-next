import { logger } from '@next/common';
import { sendEmailWorker } from './jobs/confirmationEmail.js';
import { createWorker } from './utils/queue.js';
import { updateEnrollmentsWorker } from './jobs/updateEnrollments.js';

export const emailWorker = createWorker('Send:Email', sendEmailWorker);
export const enrollmentsWorker = createWorker(
  'Enrollments:Update',
  updateEnrollmentsWorker,
);

emailWorker.on('completed', (job) => {
  logger.info({
    msg: `[QUEUE] Job ${job.queueName} completed`,
    id: job.id,
    data: job.data,
  });
});

enrollmentsWorker.on('completed', (job) => {
  logger.info({
    msg: `[QUEUE] Job ${job.queueName} completed`,
    id: job.id,
    data: job.data,
  });
});
