import { QueueManager, type QueueContext } from '@/lib/queue.server.js';
import { EMAIL_QUEUE, emailProcessor } from '@/queue/email.queue.js';
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

    // @ts-ignore for now
    queueManager.createQueue(EMAIL_QUEUE, emailProcessor);

    app.addHook('onClose', async () => {
      await queueManager.closeAll();
    });

    app.decorate('queueManager', queueManager);
    app.log.info('[QUEUE] registered');
  },
  { name: 'queue' },
);
