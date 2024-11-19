import { fetchGrades, getUFStudent } from "@/services/uf-sig";
import { normalizeDiacritics } from "@/utils/removeDiacritics";
import {
	getUFCourseCurriculums,
	getUFCourses,
	getUFCurriculumComponents,
	type UFComponent,
	type UFCourseCurriculum,
} from "@/services/ufabc-parser";
import { transformCourseName, type Course } from "@/utils/transformCourse";
import { capitalizeStr } from "@/utils/capitalizeStr";
import { getPaginatedSubjects, type PaginatedSubjects } from "@/services/next";

type SigStudent = {
	matricula: string;
	email: string;
	/** @example 2022:2 */
	entrada: string;
	nivel: "graduacao" | "licenciatura";
	status: string;
	curso: string;
};

type ShallowStudent = {
	name: string;
	ra: string;
	login: string;
	email: string | undefined;
	graduations: Array<{
		course: Course;
		campus: string;
		shift: string;
	}>;
	startedAt: string;
};

type SigComponent = {
	UFCode: string;
	name: string;
	grade: string;
	status: string;
	year: string;
	period: "1" | "2" | "3";
};

export type HydratedSigComponent = SigComponent & { credits: number }

export type HydratedComponent = HydratedSigComponent & {
	category: "free" | "mandatory" | "limited";
};

export type Student = {
	name: string;
	ra: string;
	login: string;
	email: string | undefined;
	graduations: Array<{
		course: Course;
		campus: string;
		shift: string;
		components: HydratedComponent[];
	}>;
	startedAt: string;
	lastUpdate: number;
};

export async function retrieveStudent(
	pageTrs: NodeListOf<HTMLTableRowElement>,
): Promise<ShallowStudent | null> {
	const rows = Array.from(pageTrs);
	const kvStudent = rows.map((row) => {
		const $childrens = row.children as HTMLCollectionOf<HTMLElement>;
		const cleaned = Array.from($childrens).map((column) =>
			normalizeDiacritics(column.innerText ?? ""),
		);
		return cleaned;
	});

	const rawStudent: SigStudent = Object.fromEntries(kvStudent);
	const [course, campus, kind, shift] = rawStudent.curso.split("  ");
	const NTIStudent = await getUFStudent(rawStudent.matricula);
	if (!NTIStudent) {
    console.log('could not extract student', NTIStudent)
		return null;
	}
	const fixedShift = shift === "n" ? "noturno" : "matutino";
  const name = capitalizeStr(NTIStudent.fullname)

	const student = {
		name,
		ra: rawStudent.matricula,
		login: NTIStudent.username,
		email: NTIStudent.email.find((email) =>
			email.includes("@aluno.ufabc.edu.br"),
		),
		graduations: [{
			course: transformCourseName(course, kind),
			campus: campus === "santo andre" ? "sa" : "sbc",
			shift: fixedShift,
		}],
		startedAt: rawStudent.entrada,
	};

	return student;
}

export async function scrapeMenu(
	trs: NodeListOf<HTMLTableRowElement>,
): Promise<Student | null> {
	const { data: page, error } = await fetchGrades();
	if (error && !page) {
		console.log({
			msg: "Ocorreu um erro ao extrair as disciplinas cursadas, por favor tente novamente mais tarde!",
			error,
		});
		return null;
	}


	const shallowStudent = await retrieveStudent(trs);

	if (!shallowStudent) {
		return null;
	}

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const graduationHistory = scrapeStudentHistory(page!);
	const courses = await getUFCourses();
	const currentGraduation = shallowStudent.graduations[0]; // We only have one graduation per screen
  const studentGraduation = courses.find(
    (course) => course.name === currentGraduation.course,
  );

	if (!studentGraduation) {
		console.log("error finding student graduation", currentGraduation);
		return null;
	}

	const graduationCurriculums = await getUFCourseCurriculums(
		studentGraduation.UFCourseId,
	);
	const curriculumByRa = resolveCurriculum(
		shallowStudent.ra,
		graduationCurriculums,
	);
  if (!curriculumByRa) {
	  console.log('could not get curriculum', curriculumByRa)
		return null;
	}

	if (!graduationHistory) {
		console.log("error scrapping student history", graduationHistory);
		return null;
	}

	const curriculumComponents = await getUFCurriculumComponents(
		studentGraduation.UFCourseId,
		curriculumByRa?.grade,
	);

  const subjects = await getPaginatedSubjects();
  const hydrateSigComponentsPromises = graduationHistory.map(c => hydrateSigComponent(c, subjects))
  const hydrateSigComponents = await Promise.all(hydrateSigComponentsPromises)
	const components = hydrateSigComponents.map((component) =>
		hydrateComponents(component, curriculumComponents.components),
	);

  const graduation = {
    course: currentGraduation.course,
    campus: currentGraduation.campus,
    shift: currentGraduation.shift,
    components,
  };

	const student = {
		...shallowStudent,
		graduations: [graduation],
		lastUpdate: Date.now(),
	};

	return student;
}

function scrapeStudentHistory(page: string) {
	const parser = new DOMParser();
	const gradesDocument = parser.parseFromString(page, "text/html");
	if (!gradesDocument.body) {
		console.log("could not mount document", document);
		return null;
	}

	const $periodsTable =
		gradesDocument.querySelectorAll<HTMLTableElement>(".tabelaRelatorio");
	const historyTables = Array.from($periodsTable);
	const components = historyTables.flatMap(extractComponents);

	return components;
}

function extractComponents(table: HTMLTableElement) {
	const caption = table.querySelector("caption")?.textContent?.trim() || "";
	const [year, period] = caption.split(".") as [string, "1" | "2" | "3"];
	const headers = extractHeaders(table);
	const rows = Array.from(
		table.querySelectorAll<HTMLTableRowElement>("tbody > tr"),
	);
	const components = rows.map((row) => {
		const cells = Array.from(row.children) as unknown as HTMLTableColElement[];
		const component = {
			year,
			period,
		} as SigComponent;

		headers.forEach((header, index) => {
			switch (header) {
				case "codigo":
					component.UFCode = cells[index].innerText;
					break;
				case "disciplina":
					component.name = cells[index].innerText;
					break;
				case "resultado": {
					const gradeCell = cells.find(
						(cell) =>
							cell.classList.contains("nota") && cell.innerText.trim() !== "",
					);
					component.grade = gradeCell ? gradeCell.innerText.trim() : "";
					break;
				}
				case "situacao": {
					const statusCell = cells[cells.length - 1];
					component.status = statusCell ? statusCell.innerText.trim() : "";
					break;
				}
			}
		});

		return component;
	});

	return components;
}

function extractHeaders(table: HTMLTableElement) {
	const headerCells = Array.from(table.querySelectorAll("th"));
	const wantedFields = ["codigo", "disciplina", "resultado", "situacao"];
	return headerCells
		.map((cell) => normalizeDiacritics(cell.innerText))
		.filter((header) => wantedFields.includes(header));
}

function resolveCurriculum(ra: string, curriculums: UFCourseCurriculum[]) {
	const raYear = ra.slice(2, 6);
	const sortedCurriculums = curriculums.sort(
		(a, b) => Number.parseInt(b.grade) - Number.parseInt(a.grade),
	);
	const appropriateCurriculum = sortedCurriculums.find(
		(curriculum) => Number.parseInt(curriculum.grade) <= Number.parseInt(raYear),
	);
	return appropriateCurriculum;
}

function hydrateComponents(
	sigComponent: HydratedSigComponent,
	curriculumComponents: UFComponent[],
): HydratedComponent {
	const match = curriculumComponents.find((c) => c.name === sigComponent.name.toLocaleLowerCase());
	if (!match) {
		return {
			category: "free",
			...sigComponent,
		};
	}

	return {
		name: match.name,
		category: match.category,
		credits: match.credits,
		UFCode: match.UFComponentCode,
		grade: sigComponent.grade,
		period: sigComponent.period,
		status: sigComponent.status,
		year: sigComponent.year,
	};
}

async function hydrateSigComponent(sigComponent: SigComponent, subjects: PaginatedSubjects) {

  const match = subjects.data.find(s => s.name.toLowerCase() === sigComponent.name.toLowerCase())

  if(!match) {
    return {
      ...sigComponent,
      credits: 0,
    }
  }

  return {
    ...sigComponent,
    credits: match.credits,
  };
}
