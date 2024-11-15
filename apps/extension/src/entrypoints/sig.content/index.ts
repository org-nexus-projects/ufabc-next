import { storage } from "wxt/storage";
import { scrapeMenu } from "@/scripts/sig/homepage";
import { successToast } from "@/utils/toasts";
import "toastify-js/src/toastify.css";

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
			const student = await scrapeMenu($trs);
      console.log(student)
			// storage.setItem("sync:student", student);
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
