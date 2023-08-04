import type { FastifyReply, FastifyRequest } from 'fastify';

export async function healthCheckHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    return reply.send({
      msg: 'App is healthy',
    });
  } catch (error) {
    request.log.error({ error }, 'Error in healthCheck route');
  }
}
