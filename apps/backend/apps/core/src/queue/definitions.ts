import { sendConfirmationEmail } from './jobs/email.job.js';
import { processSingleEnrollment } from './jobs/enrollments.job.js';
import { processSingleEnrolled, syncEnrolled } from './jobs/enrolled.job.js';
import { updateTeachers } from './jobs/teacher-update.job.js';
import { processComponent, syncComponents } from './jobs/components.job.js';
import {
  processComponentEnrollment,
  userEnrollmentsUpdate,
} from './jobs/user-enrollments.job.js';
import type { ConnectionOptions, WorkerOptions } from 'bullmq';
import { processComponentsTeachers } from './jobs/components-teacher.job.js';
import { uploadLogsToS3 } from './jobs/logs.job.js';
import { postInfoIntoNotionDB } from './jobs/notion-questions.job.js';

const MONTH = 60 * 60 * 24 * 30;

const redisURL = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');

export const redisConnection: ConnectionOptions = {
  username: redisURL.username,
  password: redisURL.password,
  host: redisURL.hostname,
  port: Number(redisURL.port),
};

function withConnection(
  opts: Omit<WorkerOptions, 'connection'>,
): WorkerOptions {
  return { ...opts, connection: redisConnection };
}

export const QUEUE_JOBS: Record<any, WorkerOptions> = {
  send_email: withConnection({
    removeOnComplete: { age: MONTH },
  }),
  enrollments_update: withConnection({
    concurrency: 10,
    removeOnComplete: { count: 1000, age: 24 * 60 * 60 },
    removeOnFail: { count: 500, age: 24 * 60 * 60 },
    limiter: { max: 50, duration: 1_000 },
  }),
  teacher_updateEnrollments: withConnection({
    concurrency: 5,
  }),
  sync_enrolled: withConnection({
    concurrency: 5,
  }),
  userEnrollments_update: withConnection({
    concurrency: 5,
    removeOnComplete: { count: 400, age: 0 },
  }),
  sync_components: withConnection({
    concurrency: 10,
    removeOnComplete: { count: 1000, age: 24 * 60 * 60 },
    limiter: { max: 50, duration: 1000 },
  }),
  sync_components_teachers: withConnection({
    concurrency: 10,
    removeOnComplete: { count: 1000, age: 24 * 60 * 60 },
    limiter: { max: 50, duration: 1000 },
  }),
  logs_upload: withConnection({
    concurrency: 1,
    removeOnComplete: { count: 100, age: 24 * 60 * 60 },
  }),
} as const;

export const JOBS = {
  SendEmail: {
    queue: 'send_email',
    handler: sendConfirmationEmail,
  },
  EnrolledSync: {
    queue: 'sync_enrolled',
    handler: syncEnrolled,
    every: '3 minutes',
  },
  ProcessSingleEnrolled: {
    queue: 'sync_enrolled',
    handler: processSingleEnrolled,
  },
  ComponentsSync: {
    queue: 'sync_components',
    handler: syncComponents,
    every: '1 day',
  },
  ProcessSingleComponent: {
    queue: 'sync_components',
    handler: processComponent,
  },
  UserEnrollmentsUpdate: {
    queue: 'userEnrollments_update',
    handler: userEnrollmentsUpdate,
  },
  ProcessComponentsEnrollments: {
    queue: 'userEnrollments_update',
    handler: processComponentEnrollment,
  },
  TeacherUpdate: {
    queue: 'teacher_updateEnrollments',
    handler: updateTeachers,
  },
  EnrollmentSync: {
    queue: 'enrollments_update',
    handler: processSingleEnrollment,
  },
  ComponentsTeachersSync: {
    queue: 'sync_components_teachers',
    handler: processComponentsTeachers,
  },
  LogsUpload: {
    queue: 'logs_upload',
    handler: uploadLogsToS3,
    every: '1 day',
  },
  InsertNotionPage: {
    queue: 'notion_insert',
    handler: postInfoIntoNotionDB,
  },
} as const;

export type QueueNames = keyof typeof QUEUE_JOBS;
