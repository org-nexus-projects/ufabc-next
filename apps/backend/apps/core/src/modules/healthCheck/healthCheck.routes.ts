import type { FastifyReply, FastifyRequest } from 'fastify';
import { STATES, connection } from 'mongoose';

export async function healthCheckHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { redis } = request.server;
    const isDatabaseUp = `${STATES[connection.readyState]}`;
    const isRedisUp = await redis.ping() === 'PONG' ? 'connected' : 'not connected';

    return reply.send({
      msg: 'App is healthy',
      databaseStatus: isDatabaseUp,
      redisStatus: isRedisUp
    });
  } catch (error) {
    request.log.error({ error }, 'Error in healthCheck route');
    throw error;
  }
}
