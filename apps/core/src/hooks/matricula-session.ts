import type { preHandlerAsyncHookHandler } from 'fastify';

import { UfabcMatriculaConnector } from '@next/connectors/ufabc-matricula';

declare module '@fastify/request-context' {
  interface RequestContextData {
    matriculaSession: {
      sessionId: string;
    };
  }
}

export const matriculaSession: preHandlerAsyncHookHandler = async (
  request,
  reply
) => {
  const ufabcMatriculaConnector = new UfabcMatriculaConnector({
    baseURL: request.server.config.UFABC_MATRICULA_URL,
    globalTraceId: request.id,
  })
  const { 'session-id': sessionId } = request.headers;

  if (!sessionId || typeof sessionId !== 'string') {
    return reply.unauthorized();
  }

  const sessionKey = `matricula:session:${sessionId}`;
  const cachedSession = await request.redisService.getJSON<{
    sessionId: string;
  }>(sessionKey);

  if (cachedSession) {
    request.requestContext.set('matriculaSession', {
      sessionId: cachedSession.sessionId,
    });
    return;
  }

  const isValid = await ufabcMatriculaConnector.validateToken(sessionId);
  if (!isValid) {
    return reply.forbidden();
  }

  await request.redisService.setJSON(sessionKey, { sessionId }, '20 minutes');
  request.requestContext.set('matriculaSession', {
    sessionId,
  });
};
