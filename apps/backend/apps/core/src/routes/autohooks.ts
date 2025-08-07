import type { FastifyInstance } from 'fastify';

const PUBLIC_ROUTES = [
  '/public',
  '/login',
  '/backoffice',
  '/entities/components',
  '/entities/subjects/reviews/',
  '/entities/teachers/reviews/',
  '/entities/students/stats/components',
  '/entities/students/courses',
  '/public/stats/components',
  '/users/check-email',
  '/users/facebook',
  '/help/form',
  '/users/recover',
  '/users/validate',
];

const EXTENSION_ROUTES = [
  '/entities/students/sig',
  '/histories',
  '/entities/students',
];

const isPublicRoute = (url: string): boolean => {
  return PUBLIC_ROUTES.some((route) => url.startsWith(route));
};

const isExtensionRoute = (url: string) => {
  return EXTENSION_ROUTES.some((route) => url.startsWith(route));
};

export default async function (app: FastifyInstance) {
  app.decorateRequest('sessionId');
  app.addHook('onRequest', async (request, reply) => {
    const isPublic = isPublicRoute(request.url);
    const isExtension = isExtensionRoute(request.url);

    if (isPublic) {
      return;
    }

    // Handle extension routes with session check
    if (isExtension) {
      try {
        await request.isStudent(reply);
        request.sessionId = request.headers['session-id'] as string | undefined;
        return;
      } catch (error) {
        return reply.unauthorized('Missing token');
      }
    }

    try {
      await request.jwtVerify();
    } catch (error) {
      return reply.unauthorized(
        'You must be authenticated to access this route',
      );
    }
  });
}
