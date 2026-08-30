import type { preHandlerAsyncHookHandler } from 'fastify';
import LRUWeakCache from 'lru-weak-cache';

import { MoodleConnector } from '@/connectors/moodle.js';

declare module '@fastify/request-context' {
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface RequestContextData {
    moodleSession: {
      sessionId: string;
      sessKey: string;
    };
  }
}

export type Session = {
  sessionId: string;
  sessKey: string;
};

export function isSession(value: unknown): value is Session {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sessionId' in value &&
    'sessKey' in value
  );
}

const sessionCache = new LRUWeakCache<{ sessionId: string }>({
  capacity: 5000,
  maxAge: 1000 * 60 * 5,
});

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

export const moodleSession: preHandlerAsyncHookHandler = async (
  request,
  reply
) => {
  const { 'session-id': sessionId, 'sess-key': sessKey } = request.headers;

  if (typeof sessionId !== 'string' || typeof sessKey !== 'string') {
    // should never happen, cause the schema validation runs before this hook
    return await reply.unauthorized('Missing Session');
  }

  if (sessionCache.has(sessionId)) {
    request.log.debug({ sessionId }, 'Session found in cache');
    request.requestContext.set('moodleSession', {
      sessKey,
      sessionId,
    });
    return;
  }

  const isTokenValid = await validateToken(sessionId, sessKey);
  request.log.debug({ isTokenValid }, 'Token validated');
  if (!isTokenValid) {
    return await reply.forbidden('Invalid Session');
  }
  request.log.debug({ sessionId }, 'Session validated');

  sessionCache.set(sessionId, { sessionId });
  request.requestContext.set('moodleSession', {
    sessKey,
    sessionId,
  });
  return;
};
