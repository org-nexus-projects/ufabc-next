import { exchangeExtensionToken } from './next';
import { storage } from 'wxt/storage';
import { logger } from '@/utils/logger';

export type AuthSource = 'matricula' | 'sigaa' | 'moodle';

export type AuthSession = {
  sessionId?: string;
  sessKey?: string;
  viewId?: string;
};

export async function authenticate(
  source: AuthSource,
  session: AuthSession
): Promise<string | null> {
  const storedStudent = await storage.getItem<{ login: string; ra: string }>(
    'local:student'
  );

  if (!storedStudent) {
    logger.warn({ source }, 'No stored student found; skipping token mint');
    return null;
  }

  try {
    const tokenResponse = await exchangeExtensionToken(
      source,
      session.sessionId ?? '',
      storedStudent.login,
      {
        ra: Number.parseInt(storedStudent.ra, 10),
        sessKey: session.sessKey,
        viewId: session.viewId,
      }
    );
    await storage.setItem('local:matriculaJwt', tokenResponse.token);
    return tokenResponse.token;
  } catch (error) {
    logger.error({ error, source }, 'Failed to mint extension token');
    return null;
  }
}
