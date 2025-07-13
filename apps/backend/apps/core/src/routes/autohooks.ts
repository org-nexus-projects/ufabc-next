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
  '/help/forms',
  '/users/recover',
  '/users/validate',
];

const EXTENSION_ROUTES = [
  '/entities/students/sig',
  '/histories',
  '/histories/sigaa',
  '/entities/students',
];

const getPathSegments = (url: string) => {
  const path = new URL(url, 'http://dummy').pathname; // parsing robusto
  return path.split('/').filter(Boolean);
};

const isExactRoute = (url: string, routeList: string[]): boolean => {
  const urlSegments = getPathSegments(url);

  return routeList.some((route) => {
    const routeSegments = getPathSegments(route);
    return (
      urlSegments.length === routeSegments.length &&
      routeSegments.every((seg, idx) => seg === urlSegments[idx])
    );
  });
};

const isPublicRoute = (url: string): boolean => {
  return isExactRoute(url, PUBLIC_ROUTES);
};

const isExtensionRoute = (url: string): boolean => {
  return isExactRoute(url, EXTENSION_ROUTES);
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

    // Rotas privadas exigem JWT
    try {
      await request.jwtVerify();
    } catch (error) {
      return reply.unauthorized(
        'You must be authenticated to access this route',
      );
    }
  });
}
