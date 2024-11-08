import type { FastifyInstance } from 'fastify';

export default async function (app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    if (
      request.url.startsWith('/public') ||
      request.url.startsWith('/login') ||
      request.url.startsWith('/backoffice')
    ) {
      return;
    }

    if (request.url === '/entities/components') {
      return;
    }

    try {
      await request.jwtVerify();
    } catch (error) {
      return reply.unauthorized(
        'You must be authenticated to access this route.',
      );
    }
  });
}
