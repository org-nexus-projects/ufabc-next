import 'toastify-js/src/toastify.css';
import '@/assets/tailwind.css'
import { storage } from 'wxt/storage';
import { scrapeMenu } from '@/scripts/sig/homepage';
import { createStudent, syncHistory } from '@/services/next';
import { processingToast, errorToast, successToast } from '@/utils/toasts'
import { calculateQuadrimestres } from '@/utils/season'
import { sendMessage } from '@/messaging';
import { getStudentSigHistory, type CompleteStudent } from '@/services/ufabc-parser';

export default defineContentScript({
	async main() {
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
      try {

        processingToast.showToast();
        const { data: currentStudent, error } = await scrapeMenu($trs, sessionId, viewStateID.value);
        // TODO(Joabe): move to background processing
        // https://webext-core.aklinker1.io/proxy-service/installation/
        const history = await getStudentSigHistory(sessionId, viewStateID.value, 'history');
        console.log(history)
        if (error || !currentStudent) {
          console.log(error)
          throw new Error('Erro ao buscar informações');
        }

        const existingStudent = await storage.getItem<CompleteStudent>("local:student");
        if (existingStudent?.ra === currentStudent.ra) {
          // Check if this graduation already exists
          const currentGraduation = currentStudent.graduations[0];
          const graduationExists = existingStudent.graduations.some(
            g => g.course === currentGraduation.course
          );

          if (!graduationExists) {
            const mergedStudent = {
              ...existingStudent,
              graduations: [...existingStudent.graduations, currentGraduation],
              lastUpdate: Date.now()
            };

            // update with new course
            await syncHistory({
              ra: existingStudent.ra,
              course: currentGraduation.course as string,
              grade: currentGraduation.grade,
              components: currentGraduation.components
            })

            await storage.setItem("local:student", mergedStudent);
            const studentToCreateGraduations =  mergedStudent.graduations.map(g => ({
              name: g.course as string,
              courseId: g.UFCourseId,
              turno: g.shift,
              quads: calculateQuadrimestres({ entranceQuad: mergedStudent.startedAt }),
            }))
            await createStudent({
              login: mergedStudent.login,
              ra: mergedStudent.ra,
              graduations: studentToCreateGraduations
            })
          }
          const studentToCreateGraduations =  existingStudent.graduations.map(g => ({
            name: g.course as string,
            courseId: g.UFCourseId,
            turno: g.shift,
            quads: calculateQuadrimestres({ entranceQuad: existingStudent.startedAt }),
          }))
          // update regular student - not new and same course
          await syncHistory({
            ra: existingStudent.ra,
            course: currentGraduation.course as string,
            grade: currentGraduation.grade,
            components: currentGraduation.components
          })
          await createStudent({
            login: existingStudent.login,
            ra: existingStudent.ra,
            graduations: studentToCreateGraduations
          })
        } else {
          await storage.setItem("local:student", currentStudent);
          // Create student record with first graduation
          await syncHistory({
            ra: currentStudent.ra,
            course: currentStudent?.graduations[0].course as string,
            grade: currentStudent?.graduations[0].grade,
            components: currentStudent?.graduations[0].components
          })
          const studentToCreateGraduations =  currentStudent.graduations.map(g => ({
            name: g.course as string,
            courseId: g.UFCourseId,
            turno: g.shift,
            quads: calculateQuadrimestres({ entranceQuad: currentStudent.startedAt }) ?? 0,
          }))
          await createStudent({
            login: currentStudent.login,
            ra: currentStudent.ra,
            graduations: studentToCreateGraduations
          })
        }

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
	matches: ["https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf"],
});

type Token = {

}

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
