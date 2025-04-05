import type { FastifyInstance } from 'fastify';

const PUBLIC_ROUTES = [
  '/public',
  '/login',
  '/backoffice',
  '/histories',
  '/histories/me',
  '/entities/components',
  '/entities/subjects/reviews/',
  '/entities/teachers/reviews/',
  '/entities/students/stats/components',
  '/entities/students/courses',
  '/entities/students/student',
  '/entities/students',
  '/public/stats/components',
  '/users/check-email',
  '/users/facebook',
  'help/forms',
];

const isPublicRoute = (url: string): boolean => {
  return PUBLIC_ROUTES.some((route) => url.startsWith(route));
};

export default async function (app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    const isPublic = isPublicRoute(request.url);

    if (isPublic) {
      return;
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
