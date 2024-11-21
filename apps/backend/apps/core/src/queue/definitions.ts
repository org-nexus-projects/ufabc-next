import { sendConfirmationEmail } from './jobs/email.job.js';
import { processSingleEnrollment } from './jobs/enrollments.job.js';
import { processSingleEnrolled, syncEnrolled } from './jobs/enrolled.job.js';
import { updateTeachers } from './jobs/teacher-update.job.js';
import { processComponent, syncComponents } from './jobs/components.job.js';
import {
  processComponentEnrollment,
  userEnrollmentsUpdate,
} from './jobs/user-enrollments.job.js';
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
    concurrency: 10,
    removeOnComplete: {
      count: 1000, // Keep last 1000 successful jobs
      age: 24 * 60 * 60, // Remove jobs older than 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
      age: 24 * 60 * 60,
    },
    limiter: {
      max: 50,
      duration: 1_000,
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
      age: 0,
    },
  },
  'sync:components': {
    concurrency: 10,
    removeOnComplete: {
      count: 1000,
      age: 24 * 60 * 60,
    },
    limiter: {
      max: 50,
      duration: 1000,
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
  ProcessSingleEnrolled: {
    queue: 'sync:enrolled',
    handler: processSingleEnrolled,
  },
  ComponentsSync: {
    queue: 'sync:components',
    handler: syncComponents,
    every: '1d',
  },
  ProcessSingleComponent: {
    queue: 'sync:components',
    handler: processComponent,
  },
  UserEnrollmentsUpdate: {
    queue: 'userEnrollments:update',
    handler: userEnrollmentsUpdate,
  },
  ProcessComponentsEnrollments: {
    queue: 'userEnrollments:update',
    handler: processComponentEnrollment,
  },
  TeacherUpdate: {
    queue: 'teacher:updateEnrollments',
    handler: updateTeachers,
  },
  EnrollmentSync: {
    queue: 'enrollments:update',
    handler: processSingleEnrollment,
  },
} as const;

export type QueueNames = keyof typeof QUEUE_JOBS;
