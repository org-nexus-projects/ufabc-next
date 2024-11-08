import {
  Worker,
  type Processor,
  Queue,
  type RedisOptions,
  type Job,
} from 'bullmq';
import type { FastifyInstance } from 'fastify';

export type Queues = Record<
  string,
  {
    queue: Queue;
    worker: Worker;
  }
>;

export type QueueContext<Payload> = Job<Payload> & {
  job: Job<Payload>;
  app: FastifyInstance;
};

export class QueueManager {
  private readonly registeredQueues: Queues = {};
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

  getQueue<Payload>(name: string): Queue<Payload> | undefined {
    return this.registeredQueues[name]?.queue;
  }

  createQueue<Payload>(name: string, handler: Processor): Queue {
    if (this.registeredQueues[name]) {
      return this.registeredQueues[name].queue;
    }

    const queue = new Queue<Payload>(name, {
      connection: {
        ...this.redisConfig,
        lazyConnect: true,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1_000,
        },
        removeOnComplete: true,
      },
    });

    const worker = new Worker<Payload>(
      name,
      async (job) => {
        await handler({ ...job, app: this.app } as QueueContext<Payload>);
      },
      {
        connection: {
          ...this.redisConfig,
          lazyConnect: true,
        },
      },
    );

    worker.on('error', (error) => {
      this.app.log.error({ err: error, queueName: name }, 'Queue worker error');
    });

    worker.on('completed', (job) => {
      this.app.log.debug({ jobId: job.id, queueName: name }, 'Job completed');
    });

    worker.on('failed', (job, error) => {
      this.app.log.error(
        { jobId: job?.id, err: error, queueName: name },
        'Job failed',
      );
    });

    this.registeredQueues[name] = { queue, worker };
    this.app.log.info({ queueName: name }, 'Queue started');

    return queue;
  }

  async closeAll() {
    const closePromises = Object.entries(this.registeredQueues).map(
      async ([name, { queue, worker }]) => {
        this.app.log.warn({ queueName: name }, 'Closing worker');
        await queue.close();
        await worker.close();
      },
    );

    await Promise.all(closePromises);
  }
}
