import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import Utils from "../utils/extensionUtils";
import { scrapeGradesConsulting, scrapeHomepage } from "../utils/sigaa";
Utils.injectStyle("styles/portal.css");

const loading = require("../images/loading.svg");
const logoWhite = require("../images/logo-white.svg");

const sigaaURL = new URL(document.location.href);
const isDiscentesPath = sigaaURL.pathname.includes("discente.jsf");

const toast = Toastify({
	text: `
      <div class='toast-loading-text' style='width: 250px'>
        <img src=${logoWhite} width="120" style="margin-bottom: 8px" />
        <p style="padding-bottom: 8px;">Atualizando suas informações...</p>\n\n
        <b>NÃO SAIA DESSA PÁGINA,</b>
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
		background: "linear-gradient(to right, #2E7EED, rgba(46, 126, 237, 0.5));",
	},
});

if (
	isDiscentesPath &&
	document.contains(document.querySelector("#agenda-docente"))
) {
	Utils.injectStyle("styles/portal.css");
	const student = scrapeHomepage();
	localStorage.setItem("studentInfo", JSON.stringify(student));
	Toastify({
		text: `
      <div class='toast-loading-text' style='width: 250px'>
        <img src=${logoWhite} width="120" style="margin-bottom: 8px" />
        <p style="padding-bottom: 8px;">${student.name.split(" ")[0]} Acesse suas notas!</p>\n\n
        <b>Clique no menu Ensino > consultar minhas notas</b>
      </div>`,
		gravity: "bottom",
		position: "right",
		duration: 5000,
		style: {
			background:
				"linear-gradient(to right, #2E7EED, rgba(46, 126, 237, 0.5));",
		},
		escapeMarkup: false,
	}).showToast();
}

if (isDiscentesPath && document.contains(document.querySelector(".notas"))) {
	const student = JSON.parse(localStorage.getItem("studentInfo"));
	const result = scrapeGradesConsulting();
	toast.showToast();
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
