import { Worker, type WorkerOptions } from 'bullmq';
import { JOBS, QUEUE_JOBS } from './definitions.js';
import type { FastifyInstance } from 'fastify';
import type { JobNames, JobResultType, QueueContext, TypeSafeWorker } from './types.js';

export class QueueWorker {
  private workers: Partial<Record<JobNames, TypeSafeWorker>> = {};
  private readonly app: FastifyInstance;

  constructor(app: FastifyInstance, redisURL: URL) {
    this.app = app;
  }

  public setup() {
    const isTest = this.app.config.NODE_ENV === 'test';
    if (isTest) {
      return;
    }

    for (const [name, settings] of Object.entries(QUEUE_JOBS) as [JobNames, WorkerOptions][]) {
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
        workerOpts,
      );

      this.buildWorkerEvents(worker, name);

      this.workers[name] = worker;
    }
  }

  private buildWorkerEvents(worker: Worker<unknown, unknown, JobNames>, queueName: string) {
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
      this.app.log.error({ jobId: job?.id, err: error, queueName }, 'Job failed');
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
    handler: (ctx: QueueContext<TData>) => Promise<JobResultType<JobNames>>,
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
