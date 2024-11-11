import type { Job, Queue, Worker, WorkerOptions } from 'bullmq';
import type { FastifyInstance } from 'fastify';
import type { JOBS, QUEUE_JOBS } from './definitions.js';

// // Utility type to extract handler parameter type
// type HandlerParameters<T> = T extends (params: infer P, ...args: any[]) => any
//   ? P
//   : never;

// // Utility type to extract handler return type
// type HandlerReturnType<T> = T extends (...args: any[]) => Promise<infer R>
//   ? R
//   : never;

// // Job Names type from the JOBS const
// export type JobNames = keyof typeof JOBS;

// // Queue Names type from the QUEUE_JOBS const
// export type QueueNames = keyof typeof QUEUE_JOBS;

// // Type for the parameters of each job
// export type JobParameters<T extends JobNames> = HandlerParameters<
//   (typeof JOBS)[T]['handler']
// >;

// // Type for the return data of each job
// export type JobReturnData<T extends JobNames> = HandlerReturnType<
//   (typeof JOBS)[T]['handler']
// >;

// // Type for the job handler function
// export type JobHandler<T extends JobNames> = (typeof JOBS)[T]['handler'];

// // Type-safe job definition
// export type JobDefinition = {
//   [K in JobNames]: {
//     queue: QueueNames;
//     handler: (params: JobParameters<K>) => Promise<JobReturnData<K>>;
//     every?: string;
//   };
// };

// // Type-safe queue definition
// export type QueueDefinition = {
//   [K in QueueNames]: WorkerOptions;
// };

// // Type for a single job context
// export type TypeSafeJob<T extends JobNames> = Job<
//   JobParameters<T>,
//   JobReturnData<T>,
//   T
// >;

// // Type for the queue context
// export type QueueContext<T extends JobNames = JobNames> = {
//   name: T;
//   data: JobParameters<T>;
//   app: FastifyInstance;
//   job: TypeSafeJob<T>;
// };

// // Type for the worker record
// export type WorkerRecord = Record<
//   QueueNames,
//   Worker<JobParameters<JobNames>, JobReturnData<JobNames>, JobNames>
// >;

// // Type for the queue record
// export type QueueRecord = Record<
//   QueueNames,
//   Queue<JobParameters<JobNames>, JobReturnData<JobNames>, JobNames>
// >;

// // Validate that JOBS satisfies our JobDefinition type
// declare const _jobsCheck: typeof JOBS extends JobDefinition ? true : never;

// // Validate that QUEUE_JOBS satisfies our QueueDefinition type
// declare const _queueCheck: typeof QUEUE_JOBS extends QueueDefinition
//   ? true
//   : never;

export type JobDefinition<TData = any, TResult = any> = {
  queue: keyof typeof QUEUE_JOBS;
  handler: (params: TData) => Promise<TResult>;
  every?: string;
};

// Infer types from your JOBS object
export type Jobs = typeof JOBS;
export type JobNames = keyof Jobs;
export type JobData<T extends JobNames> = Parameters<Jobs[T]['handler']>[0];
export type JobResult<T extends JobNames> = Awaited<
  ReturnType<Jobs[T]['handler']>
>;

// Improve the TypeSafeJob type
export type TypeSafeJob<T extends JobNames> = Omit<
  Job<JobData<T>, JobResult<T>, T>,
  'data'
> & {
  data: JobData<T>;
};

// Improve the QueueContext type
export type QueueContext<T extends JobNames> = TypeSafeJob<T> & {
  job: TypeSafeJob<T>;
  app: FastifyInstance;
};

// Worker type
export type TypeSafeWorker<T extends JobNames> = Worker<
  JobData<T>,
  JobResult<T>,
  T
>;
