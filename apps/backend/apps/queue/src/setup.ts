import { logger } from '@next/common';
import gracefullyShutdown from 'close-with-grace';
import { createWorker } from './helpers/queueUtil.js';
import { sendEmailWorker } from './jobs/confirmationEmail/email.js';
import { updateEnrollmentsWorker } from './jobs/enrollments/updateEnrollments.js';
import { updateUserEnrollmentsWorker } from './jobs/enrollments/updateUserEnrollments.js';
import { syncWorker } from './jobs/matriculas/sync.js';
import { updateTeachersWorker } from './jobs/enrollments/updateTeachers.js';

logger.info('[QUEUE] Starting workers');

const emailWorker = createWorker('Send:Email', sendEmailWorker);
const enrollmentsWorker = createWorker(
  'Update:Enrollments',
  updateEnrollmentsWorker,
);
const userEnrollmentsWorker = createWorker(
  'Update:UserEnrollments',
  updateUserEnrollmentsWorker,
);

const syncMatriculasWorker = createWorker('Sync:Matriculas', syncWorker, {
  concurrency: 50,
});

const updateTeachersEnrollmentsWorker = createWorker(
  'Update:TeachersEnrollments',
  updateTeachersWorker,
);

logger.info('[QUEUE] Workers started');

emailWorker.on('completed', (job) => {
  logger.info(`Job ${job.queueName} completed`);
});

enrollmentsWorker.on('completed', (job) => {
  logger.info(`Job ${job.queueName} completed`);
});

userEnrollmentsWorker.on('completed', (job) => {
  logger.info(`Job ${job.queueName} completed`);
});

syncMatriculasWorker.on('completed', (job) => {
  logger.info(`Job ${job.queueName} completed`);
});

updateTeachersEnrollmentsWorker.on('completed', (job) => {
  logger.info(`Job ${job.queueName} completed`);
});

gracefullyShutdown({ delay: 500 }, async ({ err, signal }) => {
  if (err) {
    logger.fatal({ err }, 'error starting app');
  }
  logger.info({ signal }, '[QUEUE] Gracefully shutting down workers');

  await Promise.all([
    emailWorker.close(),
    enrollmentsWorker.close(),
    userEnrollmentsWorker.close(),
    syncMatriculasWorker.close(),
    updateTeachersEnrollmentsWorker.close(),
  ]);
});
