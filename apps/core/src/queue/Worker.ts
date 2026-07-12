import type { FastifyInstance } from 'fastify';

import {
  type ConnectionOptions,
  Worker,
  type WorkerOptions,
} from 'bullmq';

import type {
  JobNames,
  JobResultType,
  QueueContext,
  QueueNames,
  TypeSafeWorker,
} from './types.js';

import { buildQueueJobs, JOBS } from './definitions.js';

export class QueueWorker {
  private workers: Partial<Record<QueueNames, TypeSafeWorker>> = {};
  private readonly app: FastifyInstance;
  private readonly redisConfig: ConnectionOptions;

  constructor(app: FastifyInstance, redisConnection: ConnectionOptions) {
    this.app = app;
    this.redisConfig = redisConnection;
  }

  public setup() {
    const isTest = this.app.config.NODE_ENV === 'test';
    if (isTest) {
      return;
    }

    const queueJobs = buildQueueJobs(this.redisConfig);

    for (const [name, settings] of Object.entries(queueJobs) as [
      QueueNames,
      WorkerOptions,
    ][]) {
      const workerOpts: WorkerOptions = {
        ...settings,
      };
      const worker = new Worker<unknown, unknown, JobNames>(
        name,
        async (job) => {
          // @ts-ignore
          const processorData: QueueContext = {
            job,
            app: this.app,
          };

          const processor = await this.WorkerHandler(processorData);
          return processor;
        },
        workerOpts
      );

      this.buildWorkerEvents(worker, name);

      this.workers[name] = worker;
    }
  }

  private buildWorkerEvents(
    worker: Worker<unknown, unknown, JobNames>,
    queueName: string
  ) {
    worker.on('error', (error) => {
      this.app.log.error({ err: error, queueName }, 'Queue worker error');
    });

    worker.on('active', (job) => {
      this.app.log.debug({ jobId: job.id, queueName }, 'Job Started');
    });

    worker.on('completed', (job) => {
      this.app.log.debug({ jobId: job.id, queueName }, 'Job completed');
    });

    worker.on('failed', (job, error) => {
      this.app.log.error(
        { jobId: job?.id, err: error, queueName },
        'Job failed'
      );
    });
  }

  public async close() {
    const workersToClose = Object.values(this.workers);
    await Promise.all(workersToClose.map((worker) => worker.close()));
    this.app.log.info('closing workers...');
  }

  private WorkerHandler<TData>(ctx: QueueContext<TData>) {
    const handlers = JOBS[ctx.job.name].handler;
    // @ts-ignore for now
    const processor = this.WorkerProcessor(ctx.job.name, handlers);
    // @ts-ignore for now
    return processor(ctx);
  }

  private WorkerProcessor<TData>(
    jobName: JobNames,
    handler: (ctx: QueueContext<TData>) => Promise<JobResultType<JobNames>>
  ) {
    const processor = async (ctx: QueueContext<TData>) => {
      try {
        const response = await handler(ctx);
        return response;
      } catch (error) {
        this.app.log.error(error, `[QUEUE] Job ${jobName} failed`, {
          parameters: ctx.job.data,
        });
        throw error;
      }
    };
    return processor;
  }
}
