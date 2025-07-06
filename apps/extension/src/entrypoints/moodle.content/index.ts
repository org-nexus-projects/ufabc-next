import { successToastMoodle, errorToastMoodle, processingToastMoodle } from '@/utils/toasts';
import { storage } from 'wxt/storage';
import { sendMessage } from '@/messaging';

async function processCourse(link: string) {
  try {
    const response = await fetch(link, { credentials: 'include' });
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const payload = Array.from(doc.querySelectorAll('div.activityname')).map(div => {
      const linkElement = div.querySelector('a');
      const spanElement = div.querySelector('span.instancename');

      const link_pdf = linkElement?.href || '';
      let nome_pdf = spanElement?.textContent || '';
      nome_pdf = nome_pdf.replace(/Arquivo/i, '').trim();

      return { link_pdf, nome_pdf };
    });

    return payload;
  } catch (err) {
    console.error(`[Scraper] Erro ao processar curso: ${link}`, err);
    return [];
  }
}

export default defineContentScript({
  async main() {
    processingToastMoodle.showToast();

    try {
      const link = window.location.href;

      let title = '';
      const heading = document.querySelector('.page-header-headings h1') as HTMLElement;
      if (heading) {
        title = heading.innerText.trim();
      } else {
        console.warn('[Scraper] Título do curso não encontrado!');
      }

      const payload = await processCourse(link);

      const sessionToken = await getToken();

      const results = {
        subject_name: title,
        payload,
        session_token: sessionToken,
      };

      console.log('[Scraper] Resultados obtidos:', results);

      await storage.setItem('local:results', results);
      await storage.setItem('local:inProgress', false);

      successToastMoodle.showToast();
    } catch (error) {
      console.error('[Moodle] Erro ao fazer scraping:', error);
      errorToastMoodle.showToast();
    } finally {
      setTimeout(() => processingToastMoodle.hideToast(), 3000);
    }
  },

  runAt: 'document_end',
  matches: ['*://moodle.ufabc.edu.br/course/view.php*'],
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
