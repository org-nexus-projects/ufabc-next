import { fastifyRedis } from '@fastify/redis';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import type { Config } from '../config/config.js';

type RedisOptions = {
  redisURL: Config['REDIS_CONNECTION_URL'];
};

export async function redis(app: FastifyInstance, opts: RedisOptions) {
  try {
    await app.register(fastifyRedis, {
      closeClient: true,
      url: opts.redisURL,
    });
    app.log.info('[PLUGIN] Redis');
  } catch (error) {
    app.log.error({ error }, '[PLUGIN] Error Connecting to Redis');
  }
}

export default fp(redis, { name: 'redis' });
