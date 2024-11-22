import { type JobsOptions, Queue, type RedisOptions } from 'bullmq';
import ms from 'ms';
import { JOBS, QUEUE_JOBS, type QueueNames } from './definitions.js';
import { FastifyAdapter } from '@bull-board/fastify';
import { boardUiPath, createBoard } from './board.js';
import type { FastifyInstance } from 'fastify';
import type {
  JobDataType,
  JobNames,
  JobResultType,
  TypeSafeQueue,
} from './types.js';

interface JobImpl {
  setup(): Promise<void>;
  close(): Promise<void>;
  clean(grace: number, limit: number, type?: string): Promise<string[]>;
  cancel(jobId: string): Promise<void>;
}

export type QueueImpl = Record<
  QueueNames,
  Queue<JobDataType<JobNames>, JobResultType<JobNames>, JobNames>
>;

export class Jobs implements JobImpl {
  private readonly queues: Record<QueueNames, TypeSafeQueue> = {} as Record<
    QueueNames,
    TypeSafeQueue
  >;
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
    for (const name of Object.keys(QUEUE_JOBS) as QueueNames[]) {
      const queue = new Queue<
        JobDataType<JobNames>,
        JobResultType<JobNames>,
        JobNames
      >(name, {
        connection: {
          ...this.redisConfig,
        },
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
        },
      });

      this.queues[name] = queue;
    }
  }

  private getQueue<TData, TResult>(
    jobName: JobNames,
  ): TypeSafeQueue<TData, TResult> {
    return this.queues[JOBS[jobName].queue] as TypeSafeQueue<TData, TResult>;
  }

  async setup() {
    const isTest = this.app.config.NODE_ENV === 'test';
    if (isTest) {
      return;
    }

    for (const [name, jobDefinition] of Object.entries(JOBS)) {
      if ('every' in jobDefinition) {
        const queue = this.queues[jobDefinition.queue];
        await queue.add(
          name as JobNames,
          { app: this.app },
          {
            repeat: {
              every: ms(jobDefinition.every),
            },
          },
        );
      }
    }
  }

  dispatch<T extends JobNames>(
    jobName: T,
    jobParameters: Omit<JobDataType<T>, 'app'>,
  ) {
    const jobOptions = {
      // removeOnComplete: true,
    } satisfies JobsOptions;

    return this.getQueue(jobName).add(jobName, jobParameters, jobOptions);
  }

  schedule<T extends JobNames>(
    jobName: T,
    jobParameters?: Omit<JobDataType<T>, 'app'>,
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
    // this.app.addHook('onRequest', async (request, reply) => {
    //   try {
    //     if (request.url.startsWith(boardUiPath)) {
    //       await request.jwtVerify();
    //     }
    //     return;
    //   } catch (error) {
    //     return reply
    //       .status(401)
    //       .send({ error: 'Unauthorized', message: 'Authentication Failed' });
    //   }
    // });
    this.app.register(bullBoard.registerPlugin(), {
      prefix: boardUiPath,
      basePath: boardUiPath,
      logLevel: 'silent',
    });
  }
}
