import { randomUUID } from 'node:crypto';
import { type Job, type JobsOptions, Queue, type RedisOptions } from 'bullmq';
import ms from 'ms';
import { Config } from '@/config/config.js';
import { NEXT_JOBS, NEXT_QUEUE_JOBS } from './jobsDefinitions.js';
import type { JobParameters, NextJobNames } from './NextWorker.js';

interface NextJob {
  setup(): Promise<void>;
  close(): Promise<void>;
  clean(grace: number, limit: number, type?: string): Promise<string[]>;
  cancel(jobId: string): Promise<void>;
  dispatch<T extends NextJobNames>(
    jobName: T,
    jobParameters: JobParameters<T>,
  ): Promise<Job>;
}

class NextJobs implements NextJob {
  private readonly queues: Record<string, Queue> = {};
  private readonly DEFAULT_REDIS_PORT = 6379;
  private readonly RedisConnection = {
    username: Config.REDIS_USER,
    password: Config.REDIS_PASSWORD,
    host: Config.REDIS_HOST,
    port: this.DEFAULT_REDIS_PORT ?? Config.REDIS_PORT,
    lazyConnect: true,
  } satisfies RedisOptions;

  constructor() {
    for (const queueName of Object.keys(NEXT_QUEUE_JOBS)) {
      this.queues[queueName] = new Queue(queueName, {
        connection: {
          ...this.RedisConnection,
        },
        defaultJobOptions: {
          attempts: 1,
        },
      });
    }
  }
  private getQueue(jobName: NextJobNames) {
    return this.queues[NEXT_JOBS[jobName].queue];
  }

  async setup() {
    const isTest = Config.NODE_ENV === 'test';
    if (isTest) {
      return;
    }

    for (const [jobName, jobDefinition] of Object.entries(NEXT_JOBS)) {
      if ('every' in jobDefinition) {
        const queue = this.queues[jobDefinition.queue];
        await queue.add(jobName, null, {
          repeat: {
            every: ms(jobDefinition.every),
          },
        });
      }
    }
  }

  dispatch<T extends NextJobNames>(
    jobName: T,
    jobParameters: JobParameters<T>,
  ) {
    const jobOptions = {
      jobId: randomUUID(),
    } satisfies JobsOptions;

    return this.getQueue(jobName).add(jobName, jobParameters, jobOptions);
  }

  schedule<T extends NextJobNames>(
    jobName: T,
    jobParameters: JobParameters<T>,
    { toWait, toWaitInMs }: { toWait?: string; toWaitInMs?: number } = {},
  ) {
    const options: JobsOptions = {
      jobId: randomUUID(),
    };

    if (toWait) {
      const convertedToWait = ms(toWait);
      if (!convertedToWait) {
        throw new Error(`Invalid format to scheduleJob: ${toWait}`);
      }

      options.delay = convertedToWait;
    }

    if (toWaitInMs) {
      options.delay = toWaitInMs;
    }

    return this.getQueue(jobName).add(jobName, jobParameters, options);
  }

  async cancel(jobId: string) {
    for (const queue of Object.values(this.queues)) {
      const job = await queue.getJob(jobId);
      if (job) {
        try {
          await job.remove();
          return;
        } catch {
          throw new Error(`Could not cancel job: ${jobId}`);
        }
      }
    }

    throw new Error(`Invalid jobId: ${jobId}`);
  }

  async close() {
    const jobsToClose = Object.values(this.queues);
    await Promise.all(jobsToClose.map((queue) => queue.close()));
  }

  async clean(
    grace: number,
    limit: number,
    type?:
      | 'completed'
      | 'wait'
      | 'active'
      | 'paused'
      | 'prioritized'
      | 'delayed'
      | 'failed',
  ) {
    const jobsToClean = Object.values(this.queues);
    return (
      await Promise.all(
        jobsToClean.map((queue) => queue.clean(grace, limit, type)),
      )
    ).flat();
  }
}

export const nextJobs = new NextJobs();
