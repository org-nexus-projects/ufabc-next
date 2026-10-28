import type { ConnectionOptions, WorkerOptions } from 'bullmq';

import { sendConfirmationEmail } from './jobs/email.job.js';
import { uploadLogsToS3 } from './jobs/logs.job.js';
import { postInfoIntoNotionDB } from './jobs/notion-help.job.js';

type JobNames =
  | 'send_email'
  | 'logs_upload'
  | 'notion_insert';

const MONTH = 60 * 60 * 24 * 30;

const redisURL = new URL(
  process.env.REDIS_CONNECTION_URL ?? 'redis://localhost:6379'
);

export const redisConnection: ConnectionOptions = {
  username: redisURL.username,
  password: redisURL.password,
  host: redisURL.hostname,
  port: Number(redisURL.port),
};

function withConnection(
  opts: Omit<WorkerOptions, 'connection'>
): WorkerOptions {
  return { ...opts, connection: redisConnection };
}

export const QUEUE_JOBS: Record<JobNames, WorkerOptions> = {
  send_email: withConnection({
    removeOnComplete: { age: MONTH },
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
