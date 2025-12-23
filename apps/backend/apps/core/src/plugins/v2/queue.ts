import { JobManager } from '@next/queues/manager';
import { fastifyPlugin as fp } from 'fastify-plugin';

declare module 'fastify' {
  export interface FastifyInstance {
    manager: JobManager;
  }
}

export default fp(
  async (app, opts: { redisURL: URL }) => {
    const jobManager = new JobManager(app, opts.redisURL, '/v2/board/ui');

    app.addHook('onClose', async () => {
      await jobManager.stop();
    });

    app.decorate('manager', jobManager);

    await jobManager.board();

    app.log.info('[QUEUE-V2] JobManager available at app.manager');
  },
  { name: 'queue-v2' },
);
