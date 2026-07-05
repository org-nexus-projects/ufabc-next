import { RedisConnector } from '@next/connectors/redis';
import { fastifyPlugin as fp } from 'fastify-plugin';
import ms from 'ms';

import { HTTP_REDIS_KEY_PREFIX } from '@/constants.js';
import type { FastifyInstance } from 'fastify';

type RedisService = {
  acquireLock: (key: string, ttl: string) => ReturnType<
    RedisConnector['acquireLock']
  >;
  releaseLock: (key: string) => ReturnType<RedisConnector['releaseLock']>;
  setJSON: (
    key: string,
    value: unknown,
    ttl: string
  ) => ReturnType<RedisConnector['setJSON']>;
  getJSON: <T>(key: string) => Promise<T | null>;
};

declare module 'fastify' {
  export interface FastifyInstance {
    redisConnector: RedisConnector;
  }

  export interface FastifyRequest {
    acquireLock: RedisService['acquireLock'];
    releaseLock: RedisService['releaseLock'];
    redisService: RedisService;
  }
}

function parseTTLToSeconds(ttl: string) {
  return Math.ceil(ms(ttl) / 1000);
}

export default fp(
  async (app: FastifyInstance) => {
    const redisConnector = new RedisConnector(app.config.REDIS_CONNECTION_URL, {
      prefix: HTTP_REDIS_KEY_PREFIX,
    });

    await redisConnector.connect();

    const redisService: RedisService = {
      acquireLock: (key, ttl) =>
        redisConnector.acquireLock(key, parseTTLToSeconds(ttl)),
      releaseLock: (key) => redisConnector.releaseLock(key),
      setJSON: (key, value, ttl) =>
        redisConnector.setJSON(key, value, parseTTLToSeconds(ttl)),
      getJSON: <T>(key: string) => redisConnector.getJSON<T>(key),
    };

    app.decorate('redis', redisConnector.client);
    app.decorate('redisConnector', redisConnector);
    app.decorateRequest('acquireLock', redisService.acquireLock);
    app.decorateRequest('releaseLock', redisService.releaseLock);
    app.decorateRequest('redisService', {
      getter: () => redisService,
    });

    app.addHook('onClose', async () => {
      await redisConnector.close();
    });

    app.log.info('[REDIS] Redis available at app.redis');
  },
  { name: 'redis' }
);
