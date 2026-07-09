import { sendResults } from '@/services/next';
import { sendMessage } from '@/messaging';
import { authenticate } from '@/services/auth';
import { logger } from '@/utils/logger';

export default defineContentScript({
  async main() {
    try {
      const sessionToken = await getToken();
      const sessKey = await getSessKey();

      await authenticate('moodle', {
        sessionId: sessionToken ?? undefined,
        sessKey: sessKey ?? undefined,
      });

      if (sessionToken && sessKey) {
        const results = {
          sessionToken: sessionToken,
          sessKey: sessKey,
        };
        await sendResults(results);
      }

    } catch (error) {
      logger.error({ error }, '[Moodle] Erro ao fazer scraping');
    }
  },

  runAt: "document_end",
  matches: ['*://moodle.ufabc.edu.br/my/courses.php*'],
});

async function getToken() {
  try {
    const token = await sendMessage('getTokenMoodle', {
      action: 'getTokenMoodle',
      pageURL: document.URL
    })
    if (!token) {
      logger.error('Could not retrieve token, please try again')
      return null
    }
    return token.value;
  } catch (error) {
    logger.error({ error }, "Failed to get MoodleSession from background script");
    return null;
  }
}

async function getSessKey(): Promise<string | null> {
  try {
    const html = document.documentElement.innerHTML;

    const sesskey = html.match(/"sesskey":"([^"]+)"/)?.[1];

    return typeof sesskey === 'undefined' ? null : sesskey;
  } catch (error) {
    logger.error({ error }, 'Erro ao extrair sesskey do HTML');
    return null;
  }
}