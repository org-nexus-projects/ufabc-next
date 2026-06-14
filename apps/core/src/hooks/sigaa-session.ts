import type { preHandlerAsyncHookHandler } from 'fastify';

import { load } from 'cheerio';

import { SigaaConnector } from '@next/connectors/sigaa';

declare module 'fastify' {
  interface FastifyRequest {
    sigaaSession: {
      sessionId: string;
      viewId: string;
    };
  }
}
export const sigaaSession: preHandlerAsyncHookHandler = async (
  request,
  reply
) => {
  const { 'session-id': sessionId, 'view-id': viewId } = request.headers;
  const sigaaConnector = new SigaaConnector({
    baseURL: request.server.config.SIGAA_URL,
    globalTraceId: request.id,
  });

  if (
    !sessionId ||
    !viewId ||
    typeof sessionId !== 'string' ||
    typeof viewId !== 'string'
  ) {
    return reply.unauthorized();
  }

  const sessionKey = `sigaa:session:${sessionId}`;
  const cachedSession = await request.redisService.getJSON<{
    sessionId: string;
    viewId: string;
  }>(sessionKey);

  if (cachedSession) {
    request.sigaaSession = cachedSession;
    return;
  }

  const authPage = await sigaaConnector.validateToken(sessionId);
  const $ = load(authPage);
  const hasLogout = $('#info-sistema > div > span.sair-sistema > a').length > 0;
  if (!hasLogout) {
    return reply.forbidden();
  }

  await request.redisService.setJSON(
    sessionKey,
    { sessionId, viewId },
    '25 minutes'
  );
  request.sigaaSession = { sessionId, viewId };
};
