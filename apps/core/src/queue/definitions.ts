import type { ConnectionOptions, WorkerOptions } from 'bullmq';

import { sendConfirmationEmail, sendBulkEmail } from './jobs/email.job.js';
import { uploadLogsToS3 } from './jobs/logs.job.js';
import { postInfoIntoNotionDB } from './jobs/notion-help.job.js';
import {
  processComponentEnrollment,
  userEnrollmentsUpdate,
} from './jobs/user-enrollments.job.js';

type QueueName =
  | 'send_email'
  | 'sync_components'
  | 'user_enrollments_update'
  | 'logs_upload'
  | 'notion_insert';

const MONTH = 60 * 60 * 24 * 30;

function withConnection(
  redisConnection: ConnectionOptions,
  opts: Omit<WorkerOptions, 'connection'>
): WorkerOptions {
  return { ...opts, connection: redisConnection };
}

export const buildQueueJobs = (
  redisConnection: ConnectionOptions
): Record<QueueName, WorkerOptions> => ({
  send_email: withConnection(redisConnection, {
    removeOnComplete: { age: MONTH },
  }),
  user_enrollments_update: withConnection(redisConnection, {
    concurrency: 5,
    removeOnComplete: { count: 400, age: 0 },
  }),
  sync_components: withConnection(redisConnection, {
    concurrency: 10,
    removeOnComplete: { count: 1000, age: 24 * 60 * 60 },
    limiter: { max: 50, duration: 1000 },
  }),
  logs_upload: withConnection(redisConnection, {
    concurrency: 1,
    removeOnComplete: { count: 100, age: 24 * 60 * 60 },
  }),
  notion_insert: withConnection(redisConnection, {
    concurrency: 5,
    removeOnComplete: { count: 100, age: 24 * 60 * 60 },
  }),
} as const);

export const JOBS = {
  SendEmail: {
    queue: 'send_email',
    handler: sendConfirmationEmail,
  },
  SendBulkEmail: {
    queue: 'send_email',
    handler: sendBulkEmail,
  },
  UserEnrollmentsUpdate: {
    queue: 'user_enrollments_update',
    handler: userEnrollmentsUpdate,
  },
  ProcessComponentsEnrollments: {
    queue: 'user_enrollments_update',
    handler: processComponentEnrollment,
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

export type QueueNames = QueueName;
