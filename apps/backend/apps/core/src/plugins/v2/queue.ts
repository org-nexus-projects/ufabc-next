import { JobManager } from '@next/queues/manager';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { jobRegistry, type JobRegistry } from '@/jobs/registry.js';

declare module 'fastify' {
  export interface FastifyInstance {
    manager: JobManager<JobRegistry>;
  }
}

export default fp(
  async (app, opts: { redisURL: URL }) => {
    const manager = new JobManager(
      app,
      jobRegistry,
      opts.redisURL,
      '/v2/board/ui',
    );

    app.decorate('manager', manager);

    app.addHook('onClose', async () => {
      await manager.stop();
    });
    app.log.info('[QUEUE-V2] JobManager available at app.manager');
  },
  { name: 'queue-v2' },
);
