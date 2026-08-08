import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { Types } from 'mongoose';

export default fp(async (app: FastifyInstance) => {
  if (app.config.NODE_ENV !== 'test' && app.config.NODE_ENV !== 'dev') return;

  app.post('/_test/token', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = app.jwt.sign({
      // Must be a valid ObjectId hex string: routes cast request.user._id
      // straight into `new Types.ObjectId(...)` (e.g. GET /comments/:teacherId),
      // and a non-hex literal like 'test-admin' throws a 500 there.
      _id: new Types.ObjectId().toString(),
      ra: 0,
      confirmed: true,
      email: 'test@example.com',
      permissions: ['admin'],
    });
    return { token };
  });
});
