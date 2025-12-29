import { sendConfirmationEmail, sendBulkEmail } from './jobs/email.job.js';
import { processSingleEnrollment } from './jobs/enrollments.job.js';
import { updateTeachers } from './jobs/teacher-update.job.js';
import { processComponent, syncComponents } from './jobs/components.job.js';
import { processComponentEnrollment, userEnrollmentsUpdate } from './jobs/user-enrollments.job.js';
import type { ConnectionOptions, WorkerOptions } from 'bullmq';
import { processComponentsTeachers } from './jobs/components-teacher.job.js';
import { uploadLogsToS3 } from './jobs/logs.job.js';
import { postInfoIntoNotionDB } from './jobs/notion-help.job.js';

type JobNames =
  | 'send_email'
  | 'enrollments_update'
  | 'teacher_update_enrollments'
  | 'sync_components'
  | 'user_enrollments_update'
  | 'sync_components_teachers'
  | 'logs_upload'
  | 'notion_insert';

const MONTH = 60 * 60 * 24 * 30;

const redisURL = new URL(process.env.REDIS_CONNECTION_URL ?? 'redis://localhost:6379');

export const redisConnection: ConnectionOptions = {
  username: redisURL.username,
  password: redisURL.password,
  host: redisURL.hostname,
  port: Number(redisURL.port),
};

function withConnection(opts: Omit<WorkerOptions, 'connection'>): WorkerOptions {
  return { ...opts, connection: redisConnection };
}

export const QUEUE_JOBS: Record<JobNames, WorkerOptions> = {
  send_email: withConnection({
    removeOnComplete: { age: MONTH },
  }),
  enrollments_update: withConnection({
    concurrency: 10,
    removeOnComplete: { count: 1000, age: 24 * 60 * 60 },
    removeOnFail: { count: 500, age: 24 * 60 * 60 },
    limiter: { max: 50, duration: 1_000 },
  }),
  teacher_update_enrollments: withConnection({
    concurrency: 5,
  }),
  user_enrollments_update: withConnection({
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
  notion_insert: withConnection({
    concurrency: 5,
    removeOnComplete: { count: 100, age: 24 * 60 * 60 },
  }),
} as const;

export const JOBS = {
  SendEmail: {
    queue: 'send_email',
    handler: sendConfirmationEmail,
  },
  SendBulkEmail: {
    queue: 'send_email',
    handler: sendBulkEmail,
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
    queue: 'user_enrollments_update',
    handler: userEnrollmentsUpdate,
  },
  ProcessComponentsEnrollments: {
    queue: 'user_enrollments_update',
    handler: processComponentEnrollment,
  },
  TeacherUpdate: {
    queue: 'teacher_update_enrollments',
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
