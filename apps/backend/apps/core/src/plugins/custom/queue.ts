import { QueueWorker } from '@/queue/Worker.js';
import { Jobs } from '@/queue/Job.js';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  export interface FastifyInstance {
    worker: QueueWorker;
    job: Jobs;
  }
}

export const autoConfig = (app: FastifyInstance) => {
  return {
    redisURL: new URL(app.config.REDIS_CONNECTION_URL),
  };
};

export default fp(
  async (app, opts: { redisURL: URL }) => {
    const worker = new QueueWorker(app, opts.redisURL);
    const jobs = new Jobs(app, opts.redisURL);

    app.addHook('onClose', async () => {
      await worker.close();
      await jobs.close();
    });

    app.decorate('worker', worker);
    app.decorate('job', jobs);

    // app.job.board();

    app.log.info('[QUEUE] registered');
  },
  { name: 'queue' },
);
