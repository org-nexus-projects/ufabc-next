import type { FastifyReply, FastifyRequest } from 'fastify';
import { STATES, connection } from 'mongoose';

export async function healthCheckHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const isDatabaseUp = `${STATES[connection.readyState]}`;
    return reply.send({
      msg: 'App is healthy',
      databaseStatus: isDatabaseUp,
    });
  } catch (error) {
    request.log.error({ error }, 'Error in healthCheck route');
    throw error;
  }
}
