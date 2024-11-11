import {
  type Job,
  type RedisOptions,
  Worker,
  type WorkerOptions,
} from 'bullmq';
import { JOBS, QUEUE_JOBS } from './definitions.js';
import type { FastifyInstance } from 'fastify';
import type {
  JobData,
  JobNames,
  JobResult,
  QueueContext,
  TypeSafeWorker,
} from './types.js';

export class QueueWorker {
  private workers: Partial<Record<JobNames, TypeSafeWorker<JobNames>>> = {};
  private readonly app: FastifyInstance;
  private readonly redisConfig: RedisOptions;

  constructor(app: FastifyInstance, redisURL: URL) {
    this.app = app;
    this.redisConfig = {
      username: redisURL.username,
      password: redisURL.password,
      host: redisURL.hostname,
      port: Number(redisURL.port),
    };
  }

  public setup() {
    const isTest = this.app.config.NODE_ENV === 'test';
    if (isTest) {
      return;
    }

    for (const [name, settings] of Object.entries(QUEUE_JOBS) as [
      JobNames,
      WorkerOptions,
    ][]) {
      const workerOpts: WorkerOptions = {
        connection: {
          ...this.redisConfig,
        },
        ...settings,
      };
      const worker = new Worker<
        JobData<typeof name>,
        JobResult<typeof name>,
        typeof name
      >(
        name,
        async (job) => {
          const processorData = {
            ...job,
            app: this.app,
          } as QueueContext<typeof name>;

          const processor = await this.WorkerHandler(processorData);
          return processor;
        },
        workerOpts,
      );

      this.buildWorkerEvents(worker, name);

      this.workers[name] = worker;
    }
  }

  private buildWorkerEvents(
    worker: TypeSafeWorker<JobNames>,
    queueName: string,
  ) {
    worker.on('error', (error) => {
      this.app.log.error({ err: error, queueName }, 'Queue worker error');
    });

    worker.on('active', (job) => {
      this.app.log.info({ jobId: job.id, queueName }, 'Job Started');
    });

    worker.on('completed', (job) => {
      this.app.log.debug({ jobId: job.id, queueName }, 'Job completed');
    });

    worker.on('failed', (job, error) => {
      this.app.log.error(
        { jobId: job?.id, err: error, queueName },
        'Job failed',
      );
    });
  }

  public async close() {
    const workersToClose = Object.values(this.workers);
    await Promise.all(workersToClose.map((worker) => worker.close()));
  }

  private WorkerHandler<T extends JobNames>(ctx: QueueContext<T>) {
    const handlers = JOBS[ctx.name].handler as (
      ctx: QueueContext<T>,
    ) => Promise<JobResult<T>>;
    const processor = this.WorkerProcessor(ctx.name, handlers);
    return processor(ctx);
  }

  private WorkerProcessor<T extends JobNames>(
    jobName: T,
    handler: (ctx: QueueContext<T>) => Promise<JobResult<T>>,
  ) {
    const processor = async (ctx: QueueContext<T>) => {
      try {
        const response = await handler(ctx.data);
        return response;
      } catch (error) {
        this.app.log.error(error, `[QUEUE] Job ${jobName} failed`, {
          parameters: ctx.data,
        });
        throw error;
      }
    };
    return processor;
  }
}
