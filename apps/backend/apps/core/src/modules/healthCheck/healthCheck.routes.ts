import type { FastifyReply, FastifyRequest } from 'fastify';
import { STATES, connection } from 'mongoose';

export async function healthCheckHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { redis } = request.server;
    const redisConn = await redis.ping();
    const isDatabaseUp = `${STATES[connection.readyState]}`;
    // eslint-disable-next-line
    const isRedisUp = redisConn === 'PONG' ? 'connected' : 'not connected';
    return reply.send({
      msg: 'App is healthy',
      databaseStatus: isDatabaseUp,
      redisStatus: isRedisUp,
    });
  } catch (error) {
    request.log.error({ error }, 'Error in healthCheck route');
    throw error;
  }
}
