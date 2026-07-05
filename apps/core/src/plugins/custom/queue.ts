import type { ConnectionOptions } from 'bullmq';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { fastifyPlugin as fp } from 'fastify-plugin';

import { Jobs } from '@/queue/Job.js';
import { QueueWorker } from '@/queue/Worker.js';

declare module 'fastify' {
  export interface FastifyInstance {
    worker: QueueWorker;
    job: Jobs;
  }
}

export const autoConfig = (app: FastifyInstance) => {
  return {
    redisConnection: app.redisConnector.getConnectionOptions(),
  };
};

export default fp(
  async (
    app: FastifyInstance,
    opts: FastifyPluginOptions & { redisConnection: ConnectionOptions }
  ) => {
    const worker = new QueueWorker(app, opts.redisConnection);
    const jobs = new Jobs(app, opts.redisConnection);

    app.addHook('onClose', async () => {
      await worker.close();
      await jobs.close();
    });

    app.decorate('worker', worker);
    app.decorate('job', jobs);

    app.job.board();

    app.log.info('[QUEUE] registered');
  },
  { name: 'queue' }
);
