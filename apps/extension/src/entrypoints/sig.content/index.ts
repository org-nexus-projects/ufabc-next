import { storage } from "wxt/storage";
import { scrapeMenu, type Student } from "@/scripts/sig/homepage";
import "toastify-js/src/toastify.css";
import '@/assets/tailwind.css'
import { createStudent, syncHistory } from "@/services/next";
import { processingToast, errorToast, successToast } from '@/utils/toasts'
import { calculateQuadrimestres } from '@/utils/season'

export default defineContentScript({
	async main() {
		const sigURL = new URL(document.location.href);
    const itineraryTable = document.querySelector<HTMLTableElement>("#turmas-portal");
    const $trs = document.querySelectorAll<HTMLTableRowElement>("#agenda-docente tbody tr");

    const shouldFormatItinerary = sigURL.pathname.includes("/portais/discente/discente.jsf") && itineraryTable;

    if (shouldFormatItinerary) {
      try {
        processingToast.showToast();
        const currentStudent = await scrapeMenu($trs);

        if (!currentStudent) {
          throw new Error("Failed to scrape student data");
        }

        const existingStudent = await storage.getItem<Student>("local:student");
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
