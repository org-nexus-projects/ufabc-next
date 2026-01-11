import type { preHandlerAsyncHookHandler } from 'fastify';

export const adminHook: preHandlerAsyncHookHandler = async (request, reply) => {
  const user = request.user;

  if (!user) {
    return reply.unauthorized();
  }

  if (!user.permissions?.includes('admin')) {
    return reply.forbidden();
  }

  return;
};
