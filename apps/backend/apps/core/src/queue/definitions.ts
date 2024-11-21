import { sendConfirmationEmail } from './jobs/email.job.js';
import { updateEnrollments } from './jobs/enrollmentsUpdate.js';
import { syncEnrolled } from './jobs/syncEnrolled.js';
import { updateTeachers } from './jobs/teacherUpdate.js';
// import { updateUserEnrollments } from './jobs/userEnrollmentsUpdate.js';
import { syncComponents } from './jobs/components.job.js';
import {
  processComponentEnrollment,
  userEnrollmentsUpdate,
} from './jobs/userEnrollments.job.js';
import type { WorkerOptions } from 'bullmq';

const MONTH = 60 * 60 * 24 * 30;

export const QUEUE_JOBS: Record<any, WorkerOptions> = {
  /**
   * Queue for sending emails
   */
  'send:email': {
    removeOnComplete: {
      age: MONTH,
    },
  },
  /**
   * Queue for updating enrollments
   */
  'enrollments:update': {
    concurrency: 1,
    removeOnComplete: {
      age: 0,
    },
  },
  /**
   * Queue for updating enrollments the teacher had lectures in
   */
  'teacher:updateEnrollments': {
    concurrency: 5,
  },
  /**
   * Queue for Syncing Matriculas with UFABC
   */
  'sync:enrolled': {
    concurrency: 5,
  },
  /**
   * Queue for updating our codebase with the users enrollments
   */
  'userEnrollments:update': {
    concurrency: 5,
    removeOnComplete: {
      count: 400,
      age: MONTH,
    },
  },
  'sync:components': {
    concurrency: 1,
    removeOnComplete: {
      age: 0,
    },
  },
} as const;

export const JOBS = {
  SendEmail: {
    queue: 'send:email',
    handler: sendConfirmationEmail,
  },
  EnrolledSync: {
    queue: 'sync:enrolled',
    handler: syncEnrolled,
    every: '2 minutes',
  },
  ComponentsSync: {
    queue: 'sync:components',
    handler: syncComponents,
    every: '1d',
  },
  EnrollmentsUpdate: {
    queue: 'enrollments:update',
    handler: updateEnrollments,
  },
  UserEnrollmentsUpdate: {
    queue: 'userEnrollments:update',
    handler: userEnrollmentsUpdate,
  },
  TeacherUpdate: {
    queue: 'teacher:updateEnrollments',
    handler: updateTeachers,
  },
  ProcessComponentsEnrollments: {
    queue: 'userEnrollments:update',
    handler: processComponentEnrollment,
  },
} as const;

export type QueueNames = keyof typeof QUEUE_JOBS;
