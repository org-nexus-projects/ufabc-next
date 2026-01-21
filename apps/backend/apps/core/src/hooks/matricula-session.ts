import type { preHandlerAsyncHookHandler } from 'fastify';

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
  const { 'session-id': sessionId } = request.headers;

  if (
    !sessionId ||
    typeof sessionId !== 'string'
  ) {
    return reply.unauthorized('Missing Session');
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

  const isValid = await validateToken(sessionId);
  if (!isValid) {
    return reply.forbidden();
  }

  await request.redisService.setJSON(
    sessionKey,
    { sessionId },
    '20 minutes'
  );
  request.requestContext.set('matriculaSession', {
    sessionId,
  });
};

async function validateToken(sessionId: string) {
  if (!sessionId) {
    return false
  }
  // const connector = new UfabcMatriculaConnector();
  // const response = await connector.validateToken(sessionId);
  // TODO: finish
  return true
}
