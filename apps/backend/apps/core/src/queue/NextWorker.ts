import { type Job, type RedisOptions, Worker } from 'bullmq';
import { logger } from '@next/common';
import { Config } from '@/config/config.js';
import { NEXT_JOBS, NEXT_QUEUE_JOBS } from './jobsDefinitions.js';

export type NextJobNames = keyof typeof NEXT_JOBS;
export type JobParameters<T extends NextJobNames> = Parameters<
  (typeof NEXT_JOBS)[T]['handler']
>[0];
export type JobFn<T extends NextJobNames> = (typeof NEXT_JOBS)[T]['handler'];

export class NextWorker {
  private workers: Record<string, Worker<any, unknown, NextJobNames>> = {};
  private readonly DEFAULT_REDIS_PORT = 6379;
  private readonly RedisConnection = {
    username: Config.REDIS_USER,
    password: Config.REDIS_PASSWORD,
    host: Config.REDIS_HOST,
    port: this.DEFAULT_REDIS_PORT ?? Config.REDIS_PORT,
    lazyConnect: true,
  } satisfies RedisOptions;

  public setup() {
    const isTest = Config.NODE_ENV === 'test';
    if (isTest) {
      return;
    }

    for (const [queueName, queueSettings] of Object.entries(NEXT_QUEUE_JOBS)) {
      this.workers[queueName] = new Worker(
        queueName,
        (job: Job<any, unknown, NextJobNames>) => this.WorkerHandler(job),
        {
          connection: {
            ...this.RedisConnection,
          },
          ...queueSettings,
        },
      );
    }
  }

  public async close() {
    const workersToClose = Object.values(this.workers);
    await Promise.all(workersToClose.map((worker) => worker.close()));
  }

  private WorkerHandler(job: Job<any, unknown, NextJobNames>) {
    const processor = this.WorkerProcessor(
      job.name,
      NEXT_JOBS[job.name].handler,
    );
    return processor(job.data);
  }

  private WorkerProcessor<T extends NextJobNames>(
    jobName: string,
    handler: JobFn<T>,
  ) {
    const processor = async (jobParameters: JobParameters<T>) => {
      logger.info({
        msg: `[QUEUE] Job ${jobName} is being processed`,
        data: jobParameters,
      });
      try {
        // @ts-expect-error
        const response = await handler(jobParameters);
        return response;
      } catch (error) {
        logger.error({
          msg: `[QUEUE] Job ${jobName} failed`,
          data: error,
          parameters: jobParameters,
        });
        throw error;
      }
    };
    return processor;
  }
}

export const nextWorker = new NextWorker();
