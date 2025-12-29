import { HTTP_REDIS_KEY_PREFIX } from '@/constants.js';
import { fastifyRedis } from '@fastify/redis';
import { fastifyPlugin as fp } from 'fastify-plugin';
import ms from 'ms';

declare module 'fastify' {
  export interface FastifyRequest {
    acquireLock: (key: string, ttl: string) => Promise<boolean>;
    releaseLock: (key: string) => Promise<boolean>;
  }
}

export default fp(
  async (app) => {
    await app.register(fastifyRedis, {
      url: app.config.REDIS_CONNECTION_URL,
      closeClient: true,
    });

    const acquireLock = async (key: string, ttl: string) => {
      const ttlInMs = ms(ttl);
      const lockKey = `${HTTP_REDIS_KEY_PREFIX}:${key}`;
      const result = await app.redis.set(lockKey, new Date().toISOString(), 'EX', ttlInMs, 'NX');

      return result === 'OK';
    };

    const releaseLock = async (key: string) => {
      const lockKey = `${HTTP_REDIS_KEY_PREFIX}:${key}`;
      const result = await app.redis.del(lockKey);
      return result === 1;
    };

    app.decorateRequest('acquireLock', acquireLock);
    app.decorateRequest('releaseLock', releaseLock);
    app.log.info('[REDIS] Redis available at app.redis');
  },
  { name: 'redis' },
);
