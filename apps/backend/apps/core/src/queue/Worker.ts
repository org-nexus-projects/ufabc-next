import {
  type Job,
  type RedisOptions,
  Worker,
  type WorkerOptions,
} from 'bullmq';
import { JOBS, QUEUE_JOBS } from './definitions.js';
import type { FastifyInstance } from 'fastify';

export type QueueContext = Job<JobReturnData, any, JobNames> & {
  job: Job<JobReturnData, any, JobNames>;
  app: FastifyInstance;
};

export type JobNames = keyof typeof JOBS;
export type JobParameters<T extends JobNames> = Parameters<
  (typeof JOBS)[T]['handler']
>[0];
export type JobFn<T extends JobNames> = (typeof JOBS)[T]['handler'];
export type JobReturnData = Awaited<ReturnType<JobFn<JobNames>>>;

export class QueueWorker {
  private workers: Record<string, Worker<any, JobReturnData, JobNames>> = {};

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

    for (const [queuename, queueSettings] of Object.entries(QUEUE_JOBS)) {
      const workerOpts: WorkerOptions = {
        connection: {
          ...this.redisConfig,
        },
        ...queueSettings,
      };
      const worker = new Worker<any, JobReturnData, JobNames>(
        queuename,
        async (job) => {
          const processor = await this.WorkerHandler({
            ...job,
            app: this.app,
          } as QueueContext);
          return processor;
        },
        workerOpts,
      );

      worker.on('error', (error) => {
        this.app.log.error({ err: error, queuename }, 'Queue worker error');
      });

      worker.on('active', (job) => {
        this.app.log.info({ jobId: job.id, queuename }, 'Job Started');
      });

      worker.on('completed', (job) => {
        this.app.log.debug({ jobId: job.id, queuename }, 'Job completed');
      });

      worker.on('failed', (job, error) => {
        this.app.log.error(
          { jobId: job?.id, err: error, queuename },
          'Job failed',
        );
      });

      this.workers[queuename] = worker;
    }
  }

  public async close() {
    const workersToClose = Object.values(this.workers);
    await Promise.all(workersToClose.map((worker) => worker.close()));
  }

  private WorkerHandler(job: Job<any, JobReturnData, JobNames>) {
    const handlers = JOBS[job.name].handler;
    const processor = this.WorkerProcessor(job.name, handlers);
    return processor(job.data);
  }

  private WorkerProcessor<T extends JobNames>(
    jobName: string,
    handler: JobFn<T>,
  ) {
    const processor = async (jobParameters: JobParameters<T>) => {
      try {
        // @ts-expect-error
        const response = await handler(jobParameters);
        return response;
      } catch (error) {
        this.app.log.error(error, `[QUEUE] Job ${jobName} failed`, {
          parameters: jobParameters,
        });
        throw error;
      }
    };
    return processor;
  }
}

// export const nextWorker = new NextWorker();
