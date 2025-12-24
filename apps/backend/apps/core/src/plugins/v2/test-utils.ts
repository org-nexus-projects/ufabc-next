import { fastifyPlugin as fp } from 'fastify-plugin';

export default fp(async (app) => {
  if (app.config.NODE_ENV !== 'test') return;

  app.post('/_test/token', async (request, reply) => {
    const token = app.jwt.sign({ id: 'test-admin', role: 'admin' });
    return { token };
  });
});
