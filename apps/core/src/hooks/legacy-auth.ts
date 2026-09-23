import type {
  onRequestAsyncHookHandler,
  preHandlerAsyncHookHandler,
} from 'fastify';

export const legacyJwtHook: onRequestAsyncHookHandler = async (
  request,
  reply
) => {
  try {
    await request.jwtVerify();
  } catch {
    return reply.unauthorized('You must be authenticated to access this route');
  }
};

export const legacyExtensionHook: onRequestAsyncHookHandler = async (
  request,
  reply
) => {
  try {
    await request.isStudent(reply);
    request.sessionId = request.headers['session-id'] as string | undefined;
  } catch {
    return reply.unauthorized('Missing token');
  }
};

export const legacyAdminHook: preHandlerAsyncHookHandler = async (
  request,
  reply
) => {
  request.isAdmin(reply);
};
