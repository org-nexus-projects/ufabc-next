// @ts-nocheck - Fastify types are not compatible with the BoardAuthHook type
import type { BoardAuthHook } from '@next/queues/manager';

export const authenticateBoard: BoardAuthHook = async (request, reply) => {
  if (request.server.config.NODE_ENV === 'dev') {
    return;
  }

  try {
    const { token } = request.query as { token?: string };
    const cookieToken = request.cookies.token;
    const tokenToVerify = token || cookieToken;

    if (!tokenToVerify) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'No token provided' });
    }

    await request.jwtVerify({
      extractToken: () => tokenToVerify,
    });

    const user = request.user;
    if (!user.permissions?.includes('admin')) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Insufficient permissions' });
    }
  } catch (error) {
    request.log.warn({ error }, 'Board access denied');
    return reply.status(401).send({ error: 'Unauthorized' });
  }
};
