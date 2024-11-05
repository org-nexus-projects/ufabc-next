import type { FastifyInstance } from 'fastify';

export default async function (app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/public') || request.url.startsWith('/login')) {
      return;
    }
    app.log.warn(request.session);
    if (!request.session.user) {
      return reply.unauthorized(
        'You must be authenticated to access this route.',
      );
    }
  });
}
