import type { JobBuilder, JobContext, JobData } from './builder.js';
import {
  Queue,
  Worker,
  type ConnectionOptions,
  type Job,
  type JobsOptions,
} from 'bullmq';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import { FastifyAdapter } from '@bull-board/fastify';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

export class JobManager {
  private readonly jobs: Map<string, JobBuilder<string, any, any>> = new Map();
  private readonly queues: Map<string, Queue> = new Map();
  private readonly workers: Map<string, Worker> = new Map();
  private isStarted = false;
  private readonly app: FastifyInstance;
  private readonly redisConnection: ConnectionOptions;
  private readonly boardPath: string;

  constructor(app: FastifyInstance, redisURL: URL, boardPath = '/board/ui') {
    this.app = app;
    this.boardPath = boardPath;
    this.redisConnection = {
      username: redisURL.username ?? '',
      password: redisURL.password ?? '',
      host: redisURL.hostname ?? '',
      port: Number(redisURL.port) ?? 6379,
    } satisfies ConnectionOptions;
  }

  register<TName extends string, TData, TResult>(
    job: JobBuilder<TName, TData, TResult>,
  ): this {
    if (this.jobs.has(job.name)) {
      this.app.log.warn({ name: job.name }, 'Job already registered, skipping');
      return this;
    }

    this.jobs.set(job.name, job);
    this.app.log.debug(
      { name: job.name, totalJobs: this.jobs.size },
      'Job registered with JobManager',
    );
    return this;
  }

  registerAll(jobs: JobBuilder<string, any, any>[]): this {
    for (const job of jobs) {
      this.register(job);
    }
    return this;
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      this.app.log.warn('JobManager already started');
      return;
    }

    const isTest = process.env.NODE_ENV === 'test';
    if (isTest) {
      this.app.log.info('Skipping JobManager start in test environment');
      return;
    }

    this.app.log.info(
      { totalJobs: this.jobs.size },
      'Starting JobManager with registered jobs',
    );

    for (const [name, jobBuilder] of this.jobs) {
      await this.setup(name, jobBuilder);
    }

    this.isStarted = true;
    this.app.log.info(
      { totalJobs: this.jobs.size },
      'JobManager started successfully',
    );
  }

  private async setup<TName extends string, TData, TResult>(
    name: TName,
    jobBuilder: JobBuilder<TName, TData, TResult>,
  ): Promise<void> {
    const queue = new Queue<JobData<TData>, TResult, TName>(name, {
      connection: this.redisConnection,
      defaultJobOptions: jobBuilder.config.jobOptions,
    });

    this.queues.set(name, queue);

    if (jobBuilder.config.schedule) {
      this.app.log.debug(
        { name, schedule: jobBuilder.config.schedule },
        'Setting up scheduled job',
      );

      await (queue as any).add(
        name,
        {} as unknown as JobData<TData>,
        {
          repeat: {
            pattern: jobBuilder.config.schedule,
            tz: jobBuilder.config.scheduleTimezone,
          },
        },
      );
    }

    const worker = new Worker<JobData<TData>, TResult, TName>(
      name,
      async (job) => {
        return this.handler<TData, TResult, TName>(job, jobBuilder);
      },
      {
        ...jobBuilder.config.workerOptions,
        connection: this.redisConnection,
      },
    );
    this.events(
      worker as unknown as Worker<JobData<TData>, TResult, string>,
      name,
    );
    this.workers.set(name, worker as unknown as Worker);
    this.app.log.debug({ name }, 'Worker setup completed');
  }

  private async handler<TData, TResult, TName extends string>(
    job: Job<JobData<TData>, TResult, TName>,
    jobBuilder: JobBuilder<TName, TData, TResult>,
  ): Promise<TResult> {
    if (!jobBuilder.config.handler) {
      throw new Error(`No handler defined for job: ${job.name}`);
    }

    if (jobBuilder.config.inputSchema) {
      jobBuilder.config.inputSchema.parse(job.data);
    }

    const ctx: JobContext<TData, TResult, TName> = {
      job,
      app: this.getApp(),
    };

    const result = await jobBuilder.config.handler(ctx);

    if (jobBuilder.config.outputSchema) {
      jobBuilder.config.outputSchema.parse(result);
    }

    return result;
  }

  private events<TData, TResult>(
    worker: Worker<TData, TResult, string>,
    name: string,
  ): void {
    worker.on('active', (job) => {
      this.app.log.info({ data: job.data }, 'Job started');
    });

    worker.on('error', (error) => {
      this.app.log.error({ error, name }, 'Queue worker error');
    });

    worker.on('stalled', (id, prev) => {
      this.app.log.debug({ jobId: id, prev, name }, 'Job stalled');
    });

    worker.on('completed', (job) => {
      this.app.log.debug({ jobId: job.id, name }, 'Job completed');
    });

    worker.on('failed', (job, error) => {
      this.app.log.error({ jobId: job?.id, error, name }, 'Job failed');
    });
  }

  private getApp(): FastifyInstance {
    // @ts-ignore
    const { mongoose, worker, job, server, config, jwt, ...rest } = this.app;
    return rest as FastifyInstance;
  }

  async dispatch<TData, TResult, TName extends string>(
    name: TName,
    data: TData,
    options?: { priority?: number; delay?: number; removeOnComplete?: boolean },
  ) {
    const queue = this.queues.get(name);

    if (!queue) {
      throw new Error(`Queue not found: ${name}`);
    }

    const baseOptions: JobsOptions = {
      jobId: randomUUID(),
      priority: options?.priority,
      delay: options?.delay,
      removeOnComplete: options?.removeOnComplete,
    };

    await queue.add(
      name as TName,
      {
        ...data,
      } as JobData<TData>,
      baseOptions,
    );
  }

  async schedule<TData, TResult, TName extends string>(
    name: TName,
    data: TData,
    options?: { priority?: number; delay?: number; removeOnComplete?: boolean },
  ) {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue not found: ${name}`);
    }
    return this.dispatch(name, data, options);
  }

  async cancel(jobId: string): Promise<void> {
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    }
  }

  async board() {
    const adapter = new FastifyAdapter();
    adapter.setBasePath(this.boardPath);

    createBullBoard({
      serverAdapter: adapter,
      queues: Array.from(this.queues.values()).map(
        (queue) => new BullMQAdapter(queue),
      ),
      options: {
        uiConfig: {
          boardTitle: 'Job Queue Dashboard',
        },
      },
    });

    this.app.register(async (app) => {
      app.addHook('onRequest', async (request, reply) => {
        if (process.env.NODE_ENV !== 'prod') {
          return;
        }

        const query = request.query as { token?: string };

        try {
          if (query.token) {
            // @ts-ignore
            await request.jwtVerify({
              extractToken: (req: FastifyRequest) =>
                (req.query as { token?: string })?.token,
            });
            // @ts-ignore
            request.isAdmin(reply);
          }
        } catch (error) {
          request.log.error({ error }, 'Failed to authenticate in jobs board');
          return reply
            .status(401)
            .send('You must be authenticated to access this route');
        }

        app.register(adapter.registerPlugin() as any, {
          prefix: this.boardPath,
          basePath: this.boardPath,
          logLevel: 'silent',
        });
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.isStarted) {
      this.app.log.warn('JobManager not started');
      return;
    }

    await Promise.all([
      ...Array.from(this.workers.values()).map((w) => w.close()),
      ...Array.from(this.queues.values()).map((q) => q.close()),
    ]);

    this.isStarted = false;
    this.app.log.info('JobManager stopped');
  }
}
