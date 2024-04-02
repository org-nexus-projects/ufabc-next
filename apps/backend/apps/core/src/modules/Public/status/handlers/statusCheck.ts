import { STATES, connections } from 'mongoose';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function getStatusCheck(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { redis } = request.server;
    const connection = connections[0];
    const redisConn = await redis.ping();
    const isDatabaseUp = `${STATES[connection.readyState]}`;
    const isRedisUp = redisConn === 'PONG' ? 'connected' : 'not connected';
    return reply.send({
      msg: 'listening...',
      databaseStatus: isDatabaseUp,
      redisStatus: isRedisUp,
    });
  } catch (error) {
    request.log.error(error, 'Error in healthCheck route');
    throw error;
  }
}
