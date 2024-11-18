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
			const student = await scrapeMenu($trs) as NonNullable<Student>;
			storage.setItem("sync:student", student);
      // this will be acessed in the ufabc matriculas, to be filtered.
			storage.setItem('session:studied', student?.graduation.components)
      // create the student for next - update code to handle the same ra in BCT and BCC
      // it should increment the graduation with the BCC data.
      console.log(student)
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


      successToast.showToast();
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
