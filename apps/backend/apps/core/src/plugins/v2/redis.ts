import { HTTP_REDIS_KEY_PREFIX } from '@/constants.js';
import { fastifyRedis } from '@fastify/redis';
import { fastifyPlugin as fp } from 'fastify-plugin';
import ms from 'ms';

type RedisService = {
  acquireLock: (key: string, ttl: string) => Promise<boolean>;
  releaseLock: (key: string) => Promise<boolean>;
  setJSON: <T>(key: string, value: T, ttl: string) => Promise<'OK'>;
  getJSON: <T>(key: string) => Promise<T | null>;
};

declare module 'fastify' {
  export interface FastifyRequest {
    acquireLock: (key: string, ttl: string) => Promise<boolean>;
    releaseLock: (key: string) => Promise<boolean>;
    redisService: RedisService;
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
      const lockKey = `${HTTP_REDIS_KEY_PREFIX}:lock:${key}`;
      const result = await app.redis.set(lockKey, new Date().toISOString(), 'EX', ttlInMs, 'NX');

      return result === 'OK';
    };

    const releaseLock = async (key: string) => {
      const lockKey = `${HTTP_REDIS_KEY_PREFIX}:lock:${key}`;
      const result = await app.redis.del(lockKey);
      return result === 1;
    };

    const redisService: RedisService = {
      acquireLock,
      releaseLock,
      setJSON: async <T>(key: string, value: T, ttl: string) => {
        const fullKey = `${HTTP_REDIS_KEY_PREFIX}:${key}`;
        const serializedValue = JSON.stringify(value);

        if (ttl) {
          return app.redis.set(fullKey, serializedValue, 'PX', ms(ttl));
        }

        return app.redis.set(fullKey, serializedValue);
      },
      getJSON: async <T>(key: string) => {
        const fullKey = `${HTTP_REDIS_KEY_PREFIX}:${key}`;
        const serializedValue = await app.redis.get(fullKey);
        if (!serializedValue) {
          return null;
        }
        return JSON.parse(serializedValue) as T;
      },
    };

    app.decorateRequest('acquireLock', acquireLock);
    app.decorateRequest('releaseLock', releaseLock);
    app.decorateRequest('redisService', {
      getter: () => redisService,
    });

    app.log.info('[REDIS] Redis available at app.redis');
  },
  { name: 'redis' },
);
