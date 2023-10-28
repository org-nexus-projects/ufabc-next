import type { FastifyReply, FastifyRequest } from 'fastify';

export function loggedUser(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;

  if (!user) {
    throw new Error('User not found');
  }

  return reply.status(200).send(user);
}
