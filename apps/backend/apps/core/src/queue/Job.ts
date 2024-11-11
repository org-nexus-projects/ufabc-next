import { type Job, type JobsOptions, Queue, type RedisOptions } from 'bullmq';
import ms from 'ms';
import { JOBS, QUEUE_JOBS } from './definitions.js';
import type { JobParameters, JobNames } from './Worker.js';
import { FastifyAdapter } from '@bull-board/fastify';
import { boardUiPath, createBoard } from './board.js';
import type { FastifyInstance } from 'fastify';

interface JobImpl {
  setup(): Promise<void>;
  close(): Promise<void>;
  clean(grace: number, limit: number, type?: string): Promise<string[]>;
  cancel(jobId: string): Promise<void>;
  dispatch<T extends JobNames>(
    jobName: T,
    jobParameters: JobParameters<T>,
  ): Promise<Job>;
}

export type QueueImpl = Record<
  string,
  Queue<JobParameters<JobNames> | null, unknown, JobNames>
>;

export class Jobs implements JobImpl {
  private readonly queues: QueueImpl = {};
  public readonly queueBoard = FastifyAdapter;

  private readonly redisConfig: RedisOptions;
  private readonly app: FastifyInstance;

  constructor(app: FastifyInstance, redisURL: URL) {
    this.app = app;
    this.redisConfig = {
      username: redisURL.username,
      password: redisURL.password,
      host: redisURL.hostname,
      port: Number(redisURL.port),
    };
    for (const queuename of Object.keys(QUEUE_JOBS)) {
      const queue = new Queue<
        JobParameters<JobNames> | null,
        unknown,
        JobNames
      >(queuename, {
        connection: {
          ...this.redisConfig,
        },
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
        },
      });
      this.queues[queuename] = queue;
    }
  }

  private getQueue(jobName: JobNames) {
    return this.queues[JOBS[jobName].queue];
  }

  async setup() {
    const isTest = this.app.config.NODE_ENV === 'test';
    if (isTest) {
      return;
    }

    for (const [jobname, jobDefinition] of Object.entries(JOBS)) {
      if ('every' in jobDefinition) {
        const queue = this.queues[jobDefinition.queue];
        await queue.add(jobname as JobNames, null, {
          repeat: {
            every: ms(jobDefinition.every),
          },
        });
      }
    }
  }

  dispatch<T extends JobNames>(jobName: T, jobParameters: JobParameters<T>) {
    const jobOptions = {
      removeOnComplete: true,
    } satisfies JobsOptions;

    return this.getQueue(jobName).add(jobName, jobParameters, jobOptions);
  }

  schedule<T extends JobNames>(
    jobName: T,
    jobParameters?: JobParameters<T>,
    { toWait, toWaitInMs }: { toWait?: string; toWaitInMs?: number } = {},
  ) {
    const options: JobsOptions = {};

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

  board() {
    const bullBoard = createBoard(Object.values(this.queues));
    this.app.register(bullBoard.registerPlugin(), {
      prefix: boardUiPath,
      basePath: boardUiPath,
      logLevel: 'silent',
    });
  }
}
