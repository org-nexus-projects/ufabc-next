import type { Job, Queue, Worker } from 'bullmq';
import type { FastifyInstance } from 'fastify';
import type { JOBS, QUEUE_JOBS } from './definitions.js';

// Basic types for job definitions
export type JobNames = keyof typeof JOBS;
export type QueueNames = keyof typeof QUEUE_JOBS;

// Context that will be injected into processors
export interface QueueContext<TData = unknown> {
  job: Job<TData, unknown, JobNames>;
  app: FastifyInstance;
}

// Type-safe queue that enforces job data and result types
export type TypeSafeQueue<TData = unknown, TResult = unknown> = Queue<
  TData,
  TResult,
  JobNames
>;

// Type-safe worker that enforces job data and result types
export type TypeSafeWorker<TData = unknown, TResult = unknown> = Worker<
  TData,
  TResult,
  JobNames
>;

// Helper type to extract the data type from a job name
export type JobDataType<T extends JobNames> =
  Parameters<(typeof JOBS)[T]['handler']>[0] extends QueueContext<infer D>
    ? D
    : never;

// Helper type to extract the result type from a job name
export type JobResultType<T extends JobNames> =
  ReturnType<(typeof JOBS)[T]['handler']> extends Promise<infer R> ? R : never;
