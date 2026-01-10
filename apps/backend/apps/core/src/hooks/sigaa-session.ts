import type { preHandlerAsyncHookHandler } from 'fastify';

import { load } from 'cheerio';

import { SigaaConnector } from '@/connectors/sigaa.js';
import { logger } from '@/utils/logger.js';

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

  if (
    !sessionId ||
    !viewId ||
    typeof sessionId !== 'string' ||
    typeof viewId !== 'string'
  ) {
    return reply.unauthorized('Missing Session');
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

  const isValid = await validateToken(sessionId);
  if (!isValid) {
    return reply.forbidden();
  }

  await request.redisService.setJSON(
    sessionKey,
    { sessionId, viewId },
    '25 minutes'
  );
  request.sigaaSession = { sessionId, viewId };
};

async function validateToken(sessionId: string) {
  const connector = new SigaaConnector();
  const response = await connector.validateToken(sessionId);
  const $ = load(response);
  const hasLogout = $('#info-sistema > div > span.sair-sistema > a').length > 0;
  return hasLogout;
}
