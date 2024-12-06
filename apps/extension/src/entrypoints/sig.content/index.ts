import { storage } from "wxt/storage";
import { scrapeMenu, type Student } from "@/scripts/sig/homepage";
import "toastify-js/src/toastify.css";
import '@/assets/tailwind.css'
import { syncHistory, type SigHistory } from "@/services/next";
import { processingToast, errorToast, successToast } from '@/utils/toasts'

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
          }
          // update regular student - not new and same course
          await syncHistory({
            ra: existingStudent.ra,
            course: currentGraduation.course as string,
            grade: currentGraduation.grade,
            components: currentGraduation.components
          })
        } else {
          // Create student record with first graduation
          await storage.setItem("local:student", currentStudent);
          await syncHistory({
            ra: currentStudent.ra,
            course: existingStudent?.graduations[0].course as string,
            grade: existingStudent?.graduations[0].grade as string,
            components: existingStudent?.graduations[0].components as SigHistory['components']
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


			// fix here the way a receive the curriculum year, maybe asking for the user
			// is the best use case
  // this will be accessed in the ufabc matriculas, to be filtered.
      // create the student for next - update code to handle the same ra in BCT and BCC
      // it should increment the graduation with the BCC data.
      // await createStudent({
      //   ra: student.ra,
      //   components: student.graduation.components,
      //   // grade: student.graduation.curriculumYear,
      //   // graduation data
      //   "mandatory_credits_number": 90,
	    //   "limited_credits_number": 57,
	    //   "free_credits_number": 43,
	    //   "credits_total": 190
      // })

