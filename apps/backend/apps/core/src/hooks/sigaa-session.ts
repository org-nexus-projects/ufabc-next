import type { preHandlerAsyncHookHandler } from 'fastify';
import { load } from 'cheerio';
import { SigaaConnector } from '@/connectors/sigaa.js';

declare module 'fastify' {
  interface FastifyRequest {
    sigaaSession: {
      sessionId: string;
      viewId: string;
    } | null;  
  }
}
export const sigaaSession: preHandlerAsyncHookHandler = async (request, reply) => {
  const { 'session-id': sessionId, 'view-id': viewId } = request.headers;

  if (!sessionId || !viewId || typeof sessionId !== 'string' || typeof viewId !== 'string') {
    return reply.unauthorized('Missing Session');
  }

  const isTokenValid = await validateToken(sessionId);
  if (!isTokenValid) {
    return reply.badRequest();
  }

  const hasSession = await request.redisService.getJSON<{ sessionId: string; viewId: string }>(`sigaa:session:${sessionId}`);
  if (!hasSession) {
    await request.redisService.setJSON(`sigaa:session:${sessionId}`, { sessionId, viewId }, '25 minutes');
    request.sigaaSession = { sessionId, viewId };
    return;
  }

  request.sigaaSession = { sessionId, viewId };
};


async function validateToken(sessionId: string) {
  const connector = new SigaaConnector();
  const response = await connector.validateToken(sessionId);
  const $ = load(response);

  const title = $('title').text();
  if (title !== 'SIGAA - Sistema Integrado de Gestão Acadêmica e Administrativa') {
    return false;
  }

  return true;
}
