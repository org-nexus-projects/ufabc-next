import { MoodleConnector } from '@/connectors/moodle.js';
import type { preHandlerAsyncHookHandler } from 'fastify';
import LRUWeakCache from 'lru-weak-cache';

declare module '@fastify/request-context' {
  interface RequestContextData {
    moodleSession: {
      sessionId: string;
      sessKey: string;
    };
  }
}

const sessionCache = new LRUWeakCache<{ sessionId: string }>({
  capacity: 5000,
  maxAge: 1000 * 60 * 5,
});

export const moodleSession: preHandlerAsyncHookHandler = async (
  request,
  reply,
) => {
  const { 'session-id': sessionId, 'sess-key': sessKey } = request.headers;

  if (
    !sessionId ||
    !sessKey ||
    typeof sessionId !== 'string' ||
    typeof sessKey !== 'string'
  ) {
    // should never happen, cause the schema validation runs before this hook
    return reply.unauthorized('Missing Session');
  }

  if (sessionCache.has(sessionId)) {
    request.log.debug({ sessionId }, 'Session found in cache');
    request.requestContext.set('moodleSession', {
      sessionId,
      sessKey,
    });
    return;
  }

  const isTokenValid = await validateToken(sessionId, sessKey);
  request.log.debug({ isTokenValid }, 'Token validated');
  if (!isTokenValid) {
    return reply.forbidden('Invalid Session');
  }
  request.log.debug({ sessionId }, 'Session validated');

  sessionCache.set(sessionId, { sessionId });
  request.requestContext.set('moodleSession', {
    sessionId,
    sessKey,
  });
};

async function validateToken(sessionId: string, sessKey: string) {
  const connector = new MoodleConnector();
  const response = await connector.validateToken(sessionId, sessKey);
  const hasError = response.some((item) => item.error);
  const hasException = response.some((item) => item.exception);

  if (hasError || hasException) {
    return false;
  }

  return true;
}
