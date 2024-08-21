import { type Job, type RedisOptions, Worker } from 'bullmq';
import { logger } from '@next/common';
import { Config } from '@/config/config.js';
import { NEXT_JOBS, NEXT_QUEUE_JOBS } from './definitions.js';

export type NextJobNames = keyof typeof NEXT_JOBS;
export type JobParameters<T extends NextJobNames> = Parameters<
  (typeof NEXT_JOBS)[T]['handler']
>[0];
export type JobFn<T extends NextJobNames> = (typeof NEXT_JOBS)[T]['handler'];
export type JobReturnData = Awaited<ReturnType<JobFn<NextJobNames>>>;

export class NextWorker {
  private workers: Record<string, Worker<any, JobReturnData, NextJobNames>> =
    {};

  private readonly REDIS_URL = new URL(Config.REDIS_CONNECTION_URL!);

  private readonly RedisConnection = {
    username: this.REDIS_URL.username,
    password: this.REDIS_URL.password,
    host: this.REDIS_URL.hostname,
    port: Number(this.REDIS_URL.port),
    lazyConnect: true,
  } satisfies RedisOptions;

  public setup() {
    const isTest = Config.NODE_ENV === 'test';
    if (isTest) {
      return;
    }

    for (const [queuename, queueSettings] of Object.entries(NEXT_QUEUE_JOBS)) {
      const workerOpts = {
        connection: {
          ...this.RedisConnection,
        },
        ...queueSettings,
      };
      const worker = new Worker<any, JobReturnData, NextJobNames>(
        queuename,
        async (job) => {
          const processor = await this.WorkerHandler(job);
          return processor;
        },
        workerOpts,
      );

      this.workers[queuename] = worker;
    }
  }

  public async close() {
    const workersToClose = Object.values(this.workers);
    await Promise.all(workersToClose.map((worker) => worker.close()));
  }

  private WorkerHandler(job: Job<any, JobReturnData, NextJobNames>) {
    const handlers = NEXT_JOBS[job.name].handler;
    const processor = this.WorkerProcessor(job.name, handlers);
    return processor(job.data);
  }

  private WorkerProcessor<T extends NextJobNames>(
    jobName: string,
    handler: JobFn<T>,
  ) {
    const processor = async (jobParameters: JobParameters<T>) => {
      logger.info({
        msg: `[QUEUE] Job ${jobName} is being processed`,
      });
      try {
        // @ts-expect-error
        const response = await handler(jobParameters);
        return response;
      } catch (error) {
        logger.error(error, `[QUEUE] Job ${jobName} failed`, {
          parameters: jobParameters,
        });
        throw error;
      }
    };
    return processor;
  }
}

// export const nextWorker = new NextWorker();
