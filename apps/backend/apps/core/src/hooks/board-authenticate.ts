// @ts-nocheck - Fastify types are not compatible with the BoardAuthHook type
import type { BoardAuthHook } from '@next/queues/manager';

export const authenticateBoard: BoardAuthHook = async (request, reply) => {
  if (request.server.config.NODE_ENV === 'dev') {
    request.log.info(request.query,'Skipping board authentication in development mode');
    return;
  }

  try {
    const { token } = request.query as { token?: string };
    const cookieToken = request.cookies.token;

    if (!token) {
      return reply
        .status(401)
        .send({ error: 'Unauthorized', message: 'No token provided' });
    }

    if (token) {
      await request.jwtVerify({
        extractToken: (req: any) => req.query.token,
      });
      request.isAdmin(reply);
      reply.setCookie('token', token, {
        path: '/v2/board/ui/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 3600,
        sameSite: 'lax',
      });
      return reply.redirect('/v2/board/ui/', 303);
    }
    
    await request.jwtVerify({
      extractToken: () => cookieToken,
    });
    request.isAdmin(reply);
  } catch (error) {
    request.log.warn(error, 'Board access denied');
    return reply.status(401).send({ error: 'Unauthorized' });
  }
};
