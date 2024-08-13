import { sendConfirmationEmail } from './jobs/email.js';
import { updateEnrollments } from './jobs/enrollmentsUpdate.js';
import { ufEnrollmentsJob } from './jobs/ufEnrolled.js';
import { updateTeachers } from './jobs/teacherUpdate.js';
// import { updateUserEnrollments } from './jobs/userEnrollmentsUpdate.js';
import { syncSubjects } from './jobs/syncSubjects.js';
import type { WorkerOptions } from 'bullmq';

type QueueDefinition = Record<string, WorkerOptions>;

const MONTH = 60 * 60 * 24 * 30;

export const NEXT_QUEUE_JOBS = {
  /**
   * Queue for sending emails
   */
  'Send:Email': {
    removeOnComplete: {
      age: MONTH,
    },
  },
  /**
   * Queue for updating enrollments
   */
  'Enrollments:Update': {
    concurrency: 1,
    removeOnComplete: {
      age: 0,
    },
  },
  /**
   * Queue for updating enrollments the teacher had lectures in
   */
  'Teacher:UpdateEnrollments': {
    concurrency: 5,
  },
  /**
   * Queue for Syncing Matriculas with UFABC
   */
  'Sync:UFEnrollments': {
    concurrency: 5,
  },
  /**
   * Queue for updating our codebase with the users enrollments
   */
  'UserEnrollments:Update': {
    concurrency: 5,
  },
  /**
   * Queue to assert all Subjects have credits
   */
  'Sync:Subject': {
    concurrency: 10,
  },
} as const satisfies QueueDefinition;

type JobsDefinition = Record<
  string,
  {
    queue: keyof typeof NEXT_QUEUE_JOBS;
    // TODO: remove any
    handler: (params: any) => Promise<unknown>;
    every?: string;
  }
>;

export const NEXT_JOBS = {
  NextSendEmail: {
    queue: 'Send:Email',
    handler: sendConfirmationEmail,
  },
  NextSyncMatriculas: {
    queue: 'Sync:UFEnrollments',
    handler: ufEnrollmentsJob,
    every: '2 minutes',
  },
  NextSyncSubjects: {
    queue: 'Sync:Subject',
    handler: syncSubjects,
    every: '5 days',
  },
  NextEnrollmentsUpdate: {
    queue: 'Enrollments:Update',
    handler: updateEnrollments,
  },
  // NextUserEnrollmentsUpdate: {
  //   queue: 'UserEnrollments:Update',
  //   handler: updateUserEnrollments,
  // },
  NextTeacherUpdate: {
    queue: 'Teacher:UpdateEnrollments',
    handler: updateTeachers,
  },
} as const satisfies JobsDefinition;
