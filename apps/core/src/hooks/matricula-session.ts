import { UfabcMatriculaConnector } from '@next/connectors/ufabc-matricula';
import { type preHandlerAsyncHookHandler } from 'fastify';

declare module '@fastify/request-context' {
  type RequestContextData = {
    matriculaSession: {
      sessionId: string;
    };
  };
}

/* oxlint-disable func-style */
export const matriculaSession: preHandlerAsyncHookHandler = async (
  request,
  reply
) => {
  const authHeader = request.headers.authorization;
  if (authHeader !== undefined && authHeader.startsWith('Bearer ')) {
    try {
      await request.jwtVerify();
      request.requestContext.set('matriculaSession', {
        sessionId: `jwt:${request.user.ra}`,
      });
      return;
    } catch {
      await reply.unauthorized('Invalid token');
    }
  }

  const { 'session-id': sessionId } = request.headers;

  if (!sessionId || typeof sessionId !== 'string') {
    await reply.unauthorized('Missing Session');
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

  const ufabcMatriculaURL = request.server.config.UFABC_MATRICULA_URL;
  const ufabcMatriculaConnector = new UfabcMatriculaConnector(
    ufabcMatriculaURL,
    request.id
  );
  const isValid = await ufabcMatriculaConnector.validateToken(sessionId);
  if (!isValid) {
    await reply.forbidden();
  }

  await request.redisService.setJSON(sessionKey, { sessionId }, '20 minutes');
  request.requestContext.set('matriculaSession', {
    sessionId,
  });
};
