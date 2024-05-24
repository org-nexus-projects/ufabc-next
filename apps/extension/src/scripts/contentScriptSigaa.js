import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import Utils from "../utils/extensionUtils";
import {  normalizeDiacritics, scrapeGradesConsulting } from "../utils/sigaa";
Utils.injectStyle("styles/portal.css");

const loading = require("../images/loading.svg");
const errorSVG = require("../images/error.svg");
const logoWhite = require("../images/logo-white.svg");

const trs = document.querySelectorAll("#agenda-docente tbody tr");
const tablesRowsArray = Array.from(trs);
const rawStudentInfo = tablesRowsArray.map((line) =>
	Array.from(line.children).map((column) =>
		normalizeDiacritics(column.innerText),
	),
);

const studentInfo = Object.fromEntries(rawStudentInfo);

const sigaaURL = new URL(document.location.href);
const isDiscentesPath = sigaaURL.pathname.includes("discente.jsf");

const toast = () => {
	const name = JSON.parse(localStorage.getItem("name"))["email"];

	return new Toastify({
		text: `
      <div class='toast-loading-text' style='width: 250px'>
        <p style="padding-bottom: 8px;">Atualizando suas informações...</p>\n\n
        <b>Olá ${name}</b>
        <p>apenas aguarde, no máx. 5 min 🙏</p>
      </div>`,
		duration: -1,
		close: false,
		gravity: "bottom",
		position: "right",
		className: "toast-loading",
		escapeMarkup: false,
		avatar: loading,
		style: {
			background:
				"linear-gradient(to right, #2E7EED, rgba(46, 126, 237, 0.5));",
		},
	});
};

if (isDiscentesPath) {
	const observer = new MutationObserver((list) => {
		if (document.contains(document.querySelector(".notas"))) {
			console.log("local", localStorage.getItem("name"));
			const result = scrapeGradesConsulting();
			localStorage.setItem("name", JSON.stringify(result));

			console.log("It's in the DOM!");
			toast().showToast();
			observer.disconnect();
		}
	});

	const newObserver = new MutationObserver((list) => {
		if (document.contains(document.querySelector("#agenda-docente"))) {
			localStorage.setItem("name", JSON.stringify(studentInfo));
			console.log("It's in the DOM!");
			toast().showToast();
			newObserver.disconnect();
		}
	});

	newObserver.observe(document.body, {
		attributes: true,
		childList: true,
		subtree: true,
	});
	observer.observe(document.body, {
		attributes: true,
		childList: true,
		subtree: true,
	});
}

// await nextApi.post(
//     "/histories/sigaa",
//     {
//       ra: ra,
//       disciplinas: jsonFicha.data,
//       curso: nomeDoCurso,
//       grade: anoDaGrade,
//     },
//     {
//       timeout: 60 * 1 * 1000, // 1 minute
//     }
//   );
