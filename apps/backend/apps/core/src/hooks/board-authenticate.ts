// @ts-nocheck - Fastify types are not compatible with the BoardAuthHook type
import type { BoardAuthHook } from '@next/queues/manager';

export const authenticateBoard: BoardAuthHook = async (request, reply) => {
  if (request.server.config.NODE_ENV !== 'prod') {
    return;
  }

  try {
    const query = request.query as { token?: string };

    if (query.token) {
      await request.jwtVerify({
        extractToken: (req: any) => req.query.token,
      });
    } else {
      await request.jwtVerify({
        extractToken: (req: any) => req.cookies.token,
      });
    }

    await request.isAdmin(reply);
  } catch (error) {
    request.log.error({ error }, 'Board auth failed');
    return reply.status(401).send('Unauthorized');
  }
};
