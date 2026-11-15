import { sendResults } from '@/services/next';
import { sendMessage } from '@/messaging';
import { logger } from '@/utils/logger';

export default defineContentScript({
  async main() {
    try {
      const sessionToken = await getToken();
      const sessKey = getSessKey();

      const results = {
        sessKey,
        sessionToken,
      };

      await sendResults(results);

    } catch (error) {
      logger.error({ error }, '[Moodle] Erro ao fazer scraping');
    }
  },

  matches: ['*://moodle.ufabc.edu.br/my/courses.php*'],

  runAt: 'document_end',
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

function getSessKey(): string | null {
  try {
    const html = document.documentElement.innerHTML;

    const sesskey = /"sesskey":"(?<sesskey>[^"]+)"/u.exec(html)?.groups?.sesskey;

    return sesskey ?? null;
  } catch (error) {
    logger.error({ error }, 'Erro ao extrair sesskey do HTML');
    return null;
  }
}