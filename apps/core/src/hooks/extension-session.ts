import { UfabcMatriculaConnector } from '@next/connectors/ufabc-matricula';
import { load } from 'cheerio';
import { type preHandlerAsyncHookHandler } from 'fastify';
import LRUWeakCache from 'lru-weak-cache';

import { MoodleConnector } from '@/connectors/moodle.js';
import { SigaaConnector } from '@/connectors/sigaa.js';

declare module '@fastify/request-context' {
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface RequestContextData {
    extensionSession: {
      source: ExtensionSource;
      sessionId: string;
      viewId?: string;
      sessKey?: string;
    };
  }
}

export type ExtensionSource = 'matricula' | 'sigaa' | 'moodle';

const moodleSessionCache = new LRUWeakCache<{ sessionId: string }>({
  capacity: 5000,
  maxAge: 1000 * 60 * 5,
});

export async function validateMatriculaToken(
  sessionId: string,
  traceId: string,
  ufabcMatriculaURL: string
) {
  const ufabcMatriculaConnector = new UfabcMatriculaConnector(
    ufabcMatriculaURL,
    traceId
  );
  return await ufabcMatriculaConnector.validateToken(sessionId);
}

export async function validateSigaaToken(sessionId: string, traceId: string) {
  const connector = new SigaaConnector(traceId);
  const response = await connector.validateToken(sessionId);
  const $ = load(response);
  const hasLogout = $('#info-sistema > div > span.sair-sistema > a').length > 0;
  return hasLogout;
}

export async function validateMoodleToken(sessionId: string, sessKey: string) {
  const connector = new MoodleConnector();
  const response = await connector.validateToken(sessionId, sessKey);
  const hasError = response.some((item) => item.error);
  const hasException = response.some((item) => item.exception);

  if (hasError || hasException) {
    return false;
  }

  return true;
}

export function extensionSession(
  source: ExtensionSource
): preHandlerAsyncHookHandler {
  return async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (authHeader !== undefined && authHeader.startsWith('Bearer ')) {
      try {
        await request.jwtVerify();
        request.requestContext.set('extensionSession', {
          sessionId: `jwt:${request.user.ra}`,
          source,
        });
        return;
      } catch {
        await reply.unauthorized('Invalid token');
      }
    }

    const { 'session-id': sessionId } = request.headers;

    if (sessionId === undefined || typeof sessionId !== 'string') {
      await reply.unauthorized('Missing Session');
      return;
    }

    switch (source) {
      case 'matricula': {
        const sessionKey = `matricula:session:${sessionId}`;
        const cachedSession = await request.redisService.getJSON<{
          sessionId: string;
        }>(sessionKey);

        if (cachedSession) {
          request.requestContext.set('extensionSession', {
            sessionId: cachedSession.sessionId,
            source,
          });
          return;
        }

        const isValid = await validateMatriculaToken(
          sessionId,
          request.id,
          request.server.config.UFABC_MATRICULA_URL
        );
        if (!isValid) {
          await reply.forbidden();
        }

        await request.redisService.setJSON(
          sessionKey,
          { sessionId },
          '20 minutes'
        );
        request.requestContext.set('extensionSession', { sessionId, source });
        return;
      }

      case 'sigaa': {
        const { 'view-id': viewId } = request.headers;

        if (!viewId || typeof viewId !== 'string') {
          await reply.unauthorized('Missing Session');
        }

        const sessionKey = `sigaa:session:${sessionId}`;
        const cachedSession = await request.redisService.getJSON<{
          sessionId: string;
          viewId: string;
        }>(sessionKey);

        if (cachedSession) {
          request.requestContext.set('extensionSession', {
            sessionId: cachedSession.sessionId,
            source,
            viewId: cachedSession.viewId,
          });
          return;
        }

        const isValid = await validateSigaaToken(sessionId, request.id);
        if (!isValid) {
          await reply.forbidden();
        }

        await request.redisService.setJSON(
          sessionKey,
          { sessionId, viewId },
          '25 minutes'
        );
        request.requestContext.set('extensionSession', {
          sessionId,
          source,
          viewId,
        });
        return;
      }

      case 'moodle': {
        const { 'sess-key': sessKey } = request.headers;

        if (!sessKey || typeof sessKey !== 'string') {
          await reply.unauthorized('Missing Session');
          return;
        }

        if (moodleSessionCache.has(sessionId)) {
          request.requestContext.set('extensionSession', {
            sessKey,
            sessionId,
            source,
          });
          return;
        }

        const isValid = await validateMoodleToken(sessionId, sessKey);
        if (!isValid) {
          await reply.forbidden('Invalid Session');
        }

        moodleSessionCache.set(sessionId, { sessionId });
        request.requestContext.set('extensionSession', {
          sessKey,
          sessionId,
          source,
        });
        return;
      }
      default: {
        await reply.unauthorized();
      }
    }
  };
}
