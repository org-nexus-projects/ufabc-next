import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';

export default fp(async (app: FastifyInstance) => {
  if (app.config.NODE_ENV !== 'test' && app.config.NODE_ENV !== 'dev') return;

  app.post('/_test/token', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = app.jwt.sign({
      _id: 'test-admin',
      ra: 0,
      confirmed: true,
      email: 'test@example.com',
      permissions: ['admin'],
    });
    return { token };
  });
});
