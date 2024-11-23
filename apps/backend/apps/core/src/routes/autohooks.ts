import type { FastifyInstance } from 'fastify';

export default async function (app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    if (
      request.url.startsWith('/public') ||
      request.url.startsWith('/login') ||
      request.url.startsWith('/backoffice') ||
      request.url.startsWith('/entities/components') ||
      request.url.startsWith('/entities/subjects') ||
      request.url.startsWith('/history') ||
      request.url.startsWith('/sync/enrollments') ||
      request.url.startsWith('/sync/components') ||
      request.url.startsWith('/entities/teachers')
    ) {
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
