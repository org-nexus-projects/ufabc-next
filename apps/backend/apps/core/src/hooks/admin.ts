import type { UserDocument } from '@/models/User.js';
import type { preHandlerHookHandler } from 'fastify';

// need to use this
export const admin: preHandlerHookHandler = async function (request, reply) {
  const token = request.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    // when token is not found the FE, should redirect to /home
    return reply.badRequest('Token not found');
  }
  const isAdminUser = this.jwt.decode<UserDocument>(token);

  if (isAdminUser?.permissions.includes('admin')) {
    return;
  }

  return reply.badRequest('This route is for admins, only for now');
};
