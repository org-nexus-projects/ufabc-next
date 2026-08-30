import type { FastifyInstance } from 'fastify';

import { fastifyPlugin as fp } from 'fastify-plugin';
import { randomUUID } from 'node:crypto';

import { SystemService } from '@/services/system-service.js';

declare module 'fastify' {
  export interface FastifyInstance {
    systemService: SystemService;
  }
}

export default fp(
  async (app: FastifyInstance) => {
    const systemService = new SystemService({
      mongoose: app.mongoose,
      redis: app.redis,
      s3Connector: app.aws.s3,
      bucket: app.config.AWS_BUCKET,
      snapshotThresholdMB: app.config.MEMORY_SNAPSHOT_THRESHOLD_MB,
      sampleIntervalSeconds: app.config.MEMORY_SAMPLE_INTERVAL_SECONDS,
      snapshotCooldownMinutes: app.config.MEMORY_SNAPSHOT_COOLDOWN_MINUTES,
      globalTraceId: randomUUID(),
    });

    app.decorate('systemService', systemService);

    systemService.startMemoryMonitor();

    app.addHook('onClose', () => {
      systemService.stopMemoryMonitor();
    });

    app.log.info(
      '[MEMORY-MONITOR] SystemService available at app.systemService'
    );
  },
  { name: 'memory-monitor', dependencies: ['mongoose', 'redis', 'aws'] }
);
