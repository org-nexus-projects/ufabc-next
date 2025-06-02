import 'toastify-js/src/toastify.css';
import '@/assets/tailwind.css'
import { storage } from 'wxt/storage';
import { scrapeMenu } from '@/scripts/sig/homepage';
import { syncHistory } from '@/services/next';
import { processingToast, errorToast, successToast } from '@/utils/toasts'
import { sendMessage } from '@/messaging';

export default defineContentScript({
	async main() {
    const sigrootURL = new URL(document.location.href);
    if (!sigrootURL.pathname.includes('/portais/discente/discente.jsf')) {
      return;
    }

    const viewStateID = document.querySelector<HTMLInputElement>(
      'input[name="javax.faces.ViewState"]'
    )
    const sessionId = await getToken();
    if (!sessionId || !viewStateID) {
      const msg = 'Ocorreu um erro ao extrair as disciplinas cursadas, por favor tente novamente mais tarde!'
      scrappingErrorToast(msg).showToast();
      return null;
    }

    const sigURL = new URL(document.location.href);
    const itineraryTable = document.querySelector<HTMLTableElement>("#turmas-portal");
    const $trs = document.querySelectorAll<HTMLTableRowElement>("#agenda-docente tbody tr");
    const shouldFormatItinerary = sigURL.pathname.includes("/portais/discente/discente.jsf") && itineraryTable;
    if (shouldFormatItinerary) {
      const sigStudent = scrapeMenu($trs, sessionId, viewStateID.value)
      if (!sigStudent.data) {

        errorToast.showToast()
        return;
      }
      try {
        processingToast.showToast();
        await storage.setItem('local:student', sigStudent.data)
        await syncHistory({
          login: sigStudent.data.login,
          ra: sigStudent.data.ra,
          sessionId,
          viewState: viewStateID.value,
        });
        successToast.showToast();
      } catch (error) {
        console.error('Student data processing failed:', error);
        errorToast.showToast();
      } finally {
        processingToast.hideToast()
      }
    }
	},
	runAt: "document_end",

  matches: [
    "https://sig.ufabc.edu.br/*",
  ],
});


async function getToken() {
  try {
    const token = await sendMessage('getToken', {
      action: 'getToken',
      pageURL: document.URL
    })
    if (!token) {
      console.error('Could not retrieve token, please try again')
      return null
    }
    return token.value;
  } catch (error) {
    console.error("Failed to get JSESSIONID from background script:", error);
    return null;
  }
}
