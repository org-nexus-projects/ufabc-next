import { type FastifyRedisPluginOptions, fastifyRedis } from '@fastify/redis';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import type { Config } from '../config/config.js';

type RedisOptions = {
  username: Config['REDIS_USER'];
  password: Config['REDIS_PASSWORD'];
  host: Config['REDIS_HOST'];
  port: Config['REDIS_PORT'];
};

export async function redis(app: FastifyInstance, opts: RedisOptions) {
  const redisOpts = {
    username: opts.username,
    password: opts.password,
    host: opts.host,
    port: opts.port,
    family: 4, // IPV4,
    closeClient: true,
  } satisfies FastifyRedisPluginOptions;
  try {
    await app.register(fastifyRedis, redisOpts);
    app.log.info('[PLUGIN] Redis');
  } catch (error) {
    app.log.error({ error }, '[PLUGIN] Error Connecting to Redis');
  }
}

export default fp(redis, { name: 'redis' });
