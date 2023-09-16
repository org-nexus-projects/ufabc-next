import type { FastifyInstance } from 'fastify';
import type { Config } from '../config';
import { type FastifyRedisPluginOptions, fastifyRedis } from '@fastify/redis';

export default async function redis(app: FastifyInstance, opts: Config) {
  const redisOpts = {
    username: opts.REDIS_USER,
    password: opts.REDIS_PASSWORD,
    host: opts.REDIS_HOST,
    port: opts.REDIS_PORT,
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
