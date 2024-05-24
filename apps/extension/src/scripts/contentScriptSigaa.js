import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import Utils from "../utils/extensionUtils";
Utils.injectStyle("styles/portal.css");

const loading = require("../images/loading.svg");
const errorSVG = require("../images/error.svg");
const logoWhite = require("../images/logo-white.svg");

const trs = document.querySelectorAll("#agenda-docente tbody tr");
const keypair = Array.from(trs).map((line) =>
	Array.from(line.children).map((column) =>
		normalizeDiacritcs(column.innerText),
	),
);

const completeObject = Object.fromEntries(keypair);

function normalizeDiacritcs(stringElement) {
	return stringElement
		.trim()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[-:]/g, "")
		.toLocaleLowerCase();
}

function isIndexSigaa() {
	return (
		document.location.href.indexOf(
			"https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf",
		) !== -1
	);
}

function getValuesFromGetGradesPageSigaa() {
	const updateDatetimeHTML = document
		.querySelector(".dataAtual")
		.textContent.trim();

	const [day, month, year, hour, minute] = updateDatetimeHTML.match(/\d+/g);
	const updateDatetime = new Date(year, month - 1, day, hour, minute);

	// * dados do aluno
	const studentDataHTML = document.querySelector(
		"#identificacao > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(1) > td",
	).textContent;
	const courseHTML = document.querySelector(
		"#identificacao > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td",
	);

	const [nameStudent, ra] = studentDataHTML.trim().split(" - ");
	const studentCourse = courseHTML.innerText;

	const quadsTableElement = document.querySelectorAll(".tabelaRelatorio");
	const quadsTable = Array.from(quadsTableElement);

	const studentHistory = [];
	for (const table of quadsTable) {
		const studentseason = table.querySelector("caption");
		const [year, quad] = studentseason.textContent.trim().split(".");

		const tableHeadersElement = table.querySelectorAll("th");
		const tableRowsElement = table.querySelectorAll("tbody > tr");
		const rawTableHeaders = Array.from(tableHeadersElement);

		const wantedFields = ["codigo", "disciplina", "resultado", "situacao"];
		const indexWantedFields = [];
		const tableHeaders = rawTableHeaders.filter((rawItem, index) => {
			const item = normalizeDiacritcs(rawItem.innerText);

			if (wantedFields.includes(item)) indexWantedFields.push(index);
			return wantedFields.includes(item);
		});

		const tableRows = Array.from(tableRowsElement);
		for (const row of tableRows) {
			const rowChildrens = Array.from(row.children);
			const cells = rowChildrens
				.filter((cellHTML, index) => indexWantedFields.includes(index))
				.map((cellHTML) => cellHTML.innerText); // picking exact header positions

			const disciplina = {};

			cells.forEach((item, index) => {
				const normalizedHeaderText = normalizeDiacritcs(
					tableHeaders[index].textContent,
				);
				disciplina[normalizedHeaderText] = item;
			});
			disciplina["ano"] = year;
			disciplina["periodo"] = quad;

			studentHistory.push(disciplina);
		}
	}

	const result = {
		updateTime: updateDatetime,
		curso: studentCourse,
		ra: Number(ra),
		disciplinas: studentHistory,
	};

	return result;
}

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

if (isIndexSigaa()) {
	const observer = new MutationObserver((list) => {
		if (document.contains(document.querySelector(".notas"))) {
			console.log("userInfo", localStorage.getItem("name"));
			const result = getValuesFromGetGradesPageSigaa();
			localStorage.setItem("userGraduationInfo", JSON.stringify(result));

			console.log("It's in the DOM!");
			toast().showToast();
			observer.disconnect();
		}
	});

	const newObserver = new MutationObserver((list) => {
		if (document.contains(document.querySelector("#agenda-docente"))) {
			localStorage.setItem("name", JSON.stringify(completeObject));
			console.log("It's in the DOM!");
			toast.showToast();
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
