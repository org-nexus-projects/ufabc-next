// @ts-nocheck - Fastify types are not compatible with the BoardAuthHook type
import type { BoardAuthHook } from '@next/queues/manager';

import { BOARD_COOKIE_MAX_AGE_SECONDS } from '@/constants.js';
import { BoardForbidden, BoardUnauthorized } from '@/errors/custom-errors.js';

export const authenticateBoard: BoardAuthHook = async (request, reply) => {
  if (request.server.config.NODE_ENV === 'dev') {
    request.log.info('Skipping board authentication in development mode');
    return;
  }

  const { token: queryToken } = request.query as { token?: string };
  const token = queryToken ?? request.cookies.token;

  if (!token) {
    throw new BoardUnauthorized();
  }

  let user;
  try {
    user = request.server.jwt.verify(token);
  } catch {
    throw new BoardUnauthorized();
  }

  if (!user.permissions?.includes('admin')) {
    throw new BoardForbidden(user._id);
  }

  if (queryToken) {
    const requestPath = request.url.split('?')[0];
    const boardPath = requestPath.endsWith('/') ? requestPath : `${requestPath}/`;
    reply.setCookie('token', queryToken, {
      path: boardPath,
      secure: request.server.config.NODE_ENV === 'prod',
      httpOnly: true,
      maxAge: BOARD_COOKIE_MAX_AGE_SECONDS,
      sameSite: 'lax',
    });
    return reply.redirect(boardPath, 303);
  }
};
