import { fastifyPlugin as fp } from 'fastify-plugin';

export default fp(async (app) => {
  if (app.config.NODE_ENV !== 'test') return;

  app.post('/_test/token', async (request, reply) => {
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
