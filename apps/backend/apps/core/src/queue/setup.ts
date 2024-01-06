import { logger } from '@next/common';
import { sendEmailWorker } from './jobs/confirmationEmail.js';
import { createWorker } from './utils/queue.js';
import { updateEnrollmentsWorker } from './jobs/enrollmentsUpdate.js';
import { userEnrollmentsUpdateWorker } from './jobs/userEnrollmentsUpdate.js';
import { updateTeachersWorker } from './jobs/teacherUpdate.js';
import { syncWorker } from './jobs/syncMatriculas.js';

type NextWorker<TJobData> = ReturnType<typeof createWorker<TJobData>>;

export function workersSetup() {
  const emailWorker = createWorker('Send:Email', sendEmailWorker);
  const enrollmentsWorker = createWorker(
    'Enrollments:Update',
    updateEnrollmentsWorker,
  );
  const userEnrollmentsWorker = createWorker(
    'UserEnrollments:Update',
    userEnrollmentsUpdateWorker,
  );
  const teachersUpdateWorker = createWorker(
    'Teacher:UpdateEnrollments',
    updateTeachersWorker,
  );
  const syncMatriculasWorker = createWorker('Matriculas:Sync', syncWorker);

  const setupListener = <TJobData>(worker: NextWorker<TJobData>) => {
    worker.on('completed', (job) => {
      logger.info({
        msg: `[QUEUE] Job ${job.queueName} completed`,
        id: job.id,
        data: job.data,
      });
    });
  };

  setupListener(emailWorker);
  setupListener(enrollmentsWorker);
  setupListener(userEnrollmentsWorker);
  setupListener(teachersUpdateWorker);
  setupListener(syncMatriculasWorker);

  return {
    emailWorker,
    enrollmentsWorker,
    userEnrollmentsWorker,
    teachersUpdateWorker,
    syncMatriculasWorker,
  };
}
