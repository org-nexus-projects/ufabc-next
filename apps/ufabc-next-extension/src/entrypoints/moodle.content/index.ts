import { sendResults } from '@/services/next';
import { sendMessage } from '@/messaging';

export default defineContentScript({
  async main() {
    try {
      const sessionToken = await getToken();
      const sessKey = await getSessKey();

      const results = {
        sessionToken: sessionToken,
        sessKey: sessKey,
      };

      await sendResults(results);

    } catch (error) {
      console.error('[Moodle] Erro ao fazer scraping:', error);
    }
  },

  runAt: 'document_end',
  matches: ['*://moodle.ufabc.edu.br/my/courses.php*'],
});

async function getToken() {
  try {
    const token = await sendMessage('getTokenMoodle', {
      action: 'getTokenMoodle',
      pageURL: document.URL
    })
    if (!token) {
      console.error('Could not retrieve token, please try again')
      return null
    }
    return token.value;
  } catch (error) {
    console.error("Failed to get MoodleSession from background script:", error);
    return null;
  }
}

async function getSessKey(): Promise<string | null> {
  try {
    const html = document.documentElement.innerHTML;

    const sesskey = html.match(/"sesskey":"([^"]+)"/)?.[1];

    return typeof sesskey === 'undefined' ? null : sesskey;
  } catch (error) {
    console.error('Erro ao extrair sesskey do HTML:', error);
    return null;
  }
}