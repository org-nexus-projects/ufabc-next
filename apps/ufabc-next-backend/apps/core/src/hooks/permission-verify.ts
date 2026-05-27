import type { preHandlerAsyncHookHandler } from 'fastify';

export const permissionVerifyHook = (
  allowedPermissions: readonly string[]
): preHandlerAsyncHookHandler => {
  return async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.unauthorized(
        'You must be authenticated to access this route'
      );
    }

    const hasPermission = request.user.permissions.some((permission) =>
      allowedPermissions.includes(permission)
    );

    if (!hasPermission) {
      return reply.forbidden('You are not authorized to access this resource.');
    }
  };
};
