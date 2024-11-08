import { QueueManager } from '@/lib/queue.server.js';
import { EMAIL_QUEUE, emailProcessor } from '@/queue/email.queue.js';
import {
  type Processor,
  type RedisOptions,
  Queue as BullQueue,
  Worker,
} from 'bullmq';
import type { FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';

declare module 'fastify' {
  export interface FastifyInstance {
    queueManager: QueueManager;
  }
}

export const autoConfig = (app: FastifyInstance) => {
  return {
    redisURL: new URL(app.config.REDIS_CONNECTION_URL),
  };
};

export default fp(
  async (app, opts: { redisURL: URL }) => {
    const queueManager = new QueueManager(app, opts.redisURL);

    queueManager.createQueue(EMAIL_QUEUE, { handler: emailProcessor });

    app.addHook('onClose', async () => {
      await queueManager.closeAll();
    });

    app.decorate('queueManager', queueManager);
    app.log.info('[QUEUE] registered');
  },
  { name: 'queue' },
);
