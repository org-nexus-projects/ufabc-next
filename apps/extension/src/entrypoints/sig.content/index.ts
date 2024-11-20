import { storage } from "wxt/storage";
import { scrapeMenu, type Student } from "@/scripts/sig/homepage";
import { successToast } from "@/utils/toasts";
import "toastify-js/src/toastify.css";
import '@/assets/tailwind.css'
import { createStudent } from "@/services/next";

export default defineContentScript({
	async main() {
		// allow content script to use session storage
		const sigURL = new URL(document.location.href);
		const itineraryTable =
			document.querySelector<HTMLTableElement>("#turmas-portal");
		const $trs = document.querySelectorAll<HTMLTableRowElement>(
			"#agenda-docente tbody tr",
		);
		const shouldFormatItinerary =
			sigURL.pathname.includes("/portais/discente/discente.jsf") &&
			itineraryTable;
		if (shouldFormatItinerary) {
			// fix here the way a receive the curriculum year, maybe asking for the user
			// is the best use case
			const currentStudent = await scrapeMenu($trs);
      if (!currentStudent) {
        console.error("Failed to scrape student data");
        return;
      }

      // Get existing student data if any
      const existingStudent = await storage.getItem<Student>("local:student");
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


      if (existingStudent?.ra === currentStudent.ra) {
        // Check if this graduation already exists
        const currentGraduation = currentStudent.graduations[0];
        const graduationExists = existingStudent.graduations.some(
          g => g.course === currentGraduation.course
        );
        if (!graduationExists) {
          // Add the new graduation to existing ones
          const mergedStudent = {
            ...existingStudent,
            graduations: [...existingStudent.graduations, currentGraduation],
            lastUpdate: Date.now()
          };

          await storage.setItem("local:student", mergedStudent);

          // Update Next API with the new graduation
          try {
            const graduationMetrics = {
              mandatory_credits_number: 90,
              limited_credits_number: 57,
              free_credits_number: 43,
              credits_total: 190
            };
            // await updateStudent({
            //   ra: currentStudent.ra,
            //   components: currentGraduation.components,
            //   courseId: currentGraduation.course,
            //   ...graduationMetrics
            // });

          } catch (error) {
            console.error(`Failed to update graduation ${currentGraduation.course}:`, error);
          }
        }
        successToast.showToast();

      } else {
        // New student, store everything
        await storage.setItem("local:student", currentStudent);
        // Create student record with first graduation
        try {
          const graduationMetrics = {
            mandatory_credits_number: 90,
            limited_credits_number: 57,
            free_credits_number: 43,
            credits_total: 190
          };

          // await createStudent({
          //   ra: currentStudent.ra,
          //   components: currentStudent.graduations[0].components,
          //   courseId: currentStudent.graduations[0].course,
          //   ...graduationMetrics
          // });
          successToast.showToast();
        } catch (error) {
          console.error('Failed to create student:', error);
        }
      }
      console.log('here', existingStudent)
    }
		// scrape student past classes to retrieve the credits
		// URL: https://sig.ufabc.edu.br/sigaa/portais/discente/turmas.jsf

		// scrape the old and new classes to retrieve the teacher name
		// URL: https://sig.ufabc.edu.br/sigaa/portais/discente/turmas.jsf

		// calculate a v0 of coefficients to make sure everything its ok
		// Popup code (vue code)
	},
	runAt: "document_end",
	matches: ["https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf"],
});
