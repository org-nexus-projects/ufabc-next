import type { preHandlerHookHandler } from 'fastify';

// need to use this
export const isAdminHook: preHandlerHookHandler = function (
  request,
  _reply,
  done,
) {
  const token = request.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    // when token is not found the FE, should redirect to /home
    throw new Error('Token not found');
  }
  const isAdminUser = this.jwt.decode(token);

  if (isAdminUser) {
    return;
  }

  done(new Error('This route is for admins, only for now'));
};
