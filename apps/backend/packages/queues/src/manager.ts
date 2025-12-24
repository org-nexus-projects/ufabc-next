import type {
  InferJobData,
  JobBuilder,
  JobContext,
  JobData,
  InferHandlerData,
} from './builder.js';
import {
  Queue,
  Worker,
  FlowProducer,
  type ConnectionOptions,
  type Job,
  type JobsOptions,
  type FlowJob,
} from 'bullmq';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { FastifyAdapter } from '@bull-board/fastify';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

export class JobManager<
  TRegistry extends Record<string, JobBuilder<any, any, any, any>>,
> {
  private readonly queues: Map<string, Queue> = new Map();
  private readonly workers: Map<string, Worker> = new Map();
  private readonly registeredJobs: Map<string, JobBuilder<any, any, any>> =
    new Map();
  private readonly flowProducer: FlowProducer;
  private isStarted = false;
  private readonly redisConnection: ConnectionOptions;
  private readonly boardPath: string;

  constructor(
    private readonly app: FastifyInstance,
    private readonly jobs: TRegistry,
    redisURL: URL,
    boardPath: string,
  ) {
    this.app = app;
    this.boardPath = boardPath;
    this.redisConnection = {
      username: redisURL.username ?? '',
      password: redisURL.password ?? '',
      host: redisURL.hostname ?? '',
      port: Number(redisURL.port) ?? 6379,
    } satisfies ConnectionOptions;
    this.flowProducer = new FlowProducer({
      connection: this.redisConnection,
    });

    for (const [name, builder] of Object.entries(this.jobs)) {
      this.registeredJobs.set(name, builder);
    }
  }

  async dispatchFlow(flow: FlowJob) {
    await this.flowProducer.add(flow);
  }

  register<TName extends string, TData, TResult>(
    job: JobBuilder<TName, TData, TResult>,
  ): this {
    if (this.registeredJobs.has(job.name)) {
      this.app.log.warn({ name: job.name }, 'Job already registered, skipping');
      return this;
    }

    this.registeredJobs.set(job.name, job);
    this.app.log.debug(
      { name: job.name, totalJobs: this.registeredJobs.size },
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
      { totalJobs: this.registeredJobs.size },
      'Starting JobManager with registered jobs',
    );

    for (const [name, builder] of this.registeredJobs) {
      await this.setup(name, builder);
    }

    this.isStarted = true;
    this.app.log.info(
      { totalJobs: this.queues.size },
      'JobManager started successfully',
    );
  }

  private async setup<TName extends string, TData, TResult>(
    name: TName,
    jobBuilder: JobBuilder<TName, TData, TResult>,
  ): Promise<void> {
    const queue = new Queue(name, {
      connection: this.redisConnection,
      defaultJobOptions: jobBuilder.config.jobOptions,
    });

    this.queues.set(name, queue);

    if (jobBuilder.config.schedule) {
      this.app.log.debug(
        { name, schedule: jobBuilder.config.schedule },
        'Setting up scheduled job',
      );

      await queue.add(
        name,
        {},
        {
          repeat: {
            pattern: jobBuilder.config.schedule,
            tz: jobBuilder.config.scheduleTimezone,
          },
        },
      );
    }

    const worker = new Worker(
      name,
      async (job) => this.handler(job, jobBuilder),
      {
        ...jobBuilder.config.workerOptions,
        connection: this.redisConnection,
      },
    );

    this.events(
      worker as unknown as Worker<JobData<TData>, TResult, string>,
      name,
    );

    this.workers.set(name, worker);

    this.app.log.debug({ name }, 'Worker setup completed');
  }

  private async handler(job: Job, jobBuilder: JobBuilder<any, any, any>) {
    const schema =
      jobBuilder.config.workerSchema || jobBuilder.config.inputSchema;

    if (schema) {
      schema.parse(job.data);
    }

    const ctx: JobContext = { job, app: this.app, manager: this };

    if (!jobBuilder.config.handler) {
      throw new Error(`No handler defined for job: ${job.name}`);
    }

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

  async dispatch<TName extends Extract<keyof TRegistry, string>>(
    name: TName,
    data: InferJobData<TRegistry[TName]>,
    options?: JobsOptions,
  ) {
    const queue = this.queues.get(name);
    const builder = this.registeredJobs.get(name);

    if (!queue || !builder) {
      throw new Error(`Queue ${name} not initialized`);
    }

    const iteratorKey = builder.config.iteratorKey as unknown as string;
    const dataObj = data as Record<string, any>;
    if (iteratorKey && Array.isArray(dataObj[iteratorKey])) {
      const array = dataObj[iteratorKey];
      const sharedData = { ...dataObj };
      delete sharedData[iteratorKey];

      const jobs = array.map((item) => ({
        name,
        data: { ...sharedData, [iteratorKey]: item },
        opts: { ...options, jobId: randomUUID() },
      }));

      return queue.addBulk(jobs);
    }

    return queue.add(name, data, { ...options, jobId: randomUUID() });
  }

  async schedule<TName extends Extract<keyof TRegistry, string>>(
    name: TName,
    data: InferJobData<TRegistry[TName]>,
    options?: JobsOptions,
  ) {
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

    const bullMqAdapters = Array.from(this.queues.values()).map(
      (queue) => new BullMQAdapter(queue),
    );

    if (bullMqAdapters.length === 0) {
      this.app.log.warn(
        '[QUEUE-V2] Board initialized with 0 queues. Ensure manager.start() was called first.',
      );
    }

    createBullBoard({
      serverAdapter: adapter,
      queues: bullMqAdapters,
      options: {
        uiConfig: {
          boardTitle: 'Job Queue Dashboard',
        },
      },
    });

    this.app.register(async (app) => {
      app.addHook('onRequest', async (request, reply) => {
        if (process.env.NODE_ENV === 'prod') {
          const query = request.query as { token?: string };

          try {
            if (query.token) {
              // @ts-ignore
              await request.jwtVerify({
                extractToken: (req: any) => req.query.token,
              });
              // @ts-ignore
              request.isAdmin(reply);
            } else {
              // @ts-ignore
              await request.jwtVerify({
                extractToken: (req: any) => req.cookies.token,
              });
              // @ts-ignore
              request.isAdmin(reply);
            }
          } catch (error) {
            request.log.error(
              { error },
              'Failed to authenticate in jobs board',
            );
            return reply
              .status(401)
              .send('You must be authenticated to access this route');
          }
        }
      });

      // Register the board plugin outside the hook so it's always available
      app.register(adapter.registerPlugin() as any, {
        prefix: this.boardPath,
        basePath: this.boardPath,
        logLevel: 'silent',
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
