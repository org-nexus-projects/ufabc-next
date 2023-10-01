import type { FastifyInstance } from 'fastify';
import { authenticate } from '../hooks/authenticate.js';

export const autoPrefix = '/v2';
export default async function (app: FastifyInstance) {
  app.get(
    '/users/info',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const user = request.user;

      if (!user) {
        throw new Error('User not found');
      }

      return reply.status(200).send(user);
    },
  );
}
