import type { FastifyInstance } from 'fastify';
import { JobManager } from '@next/queues/manager';
import { fastifyPlugin as fp } from 'fastify-plugin';

import { jobRegistry, type JobRegistry } from '@/jobs/registry.js';

declare module 'fastify' {
  export interface FastifyInstance {
    manager: JobManager<JobRegistry>;
  }
}

export default fp(
  async (app: FastifyInstance) => {
    const manager = new JobManager(
      app,
      jobRegistry,
      app.redisConnector.getConnectionOptions(),
      '/v2/board/ui'
    );

    app.decorate('manager', manager);

    app.addHook('onClose', async () => {
      await manager.stop();
    });
    app.log.info('[QUEUE-V2] JobManager available at app.manager');
  },
  { name: 'queue-v2' }
);
