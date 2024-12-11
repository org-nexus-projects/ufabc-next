import { fetchGrades, fetchClasses, getUFStudent } from '@/services/uf-sig';
import { normalizeDiacritics } from '@/utils/remove-diacritics';
import {
	getUFCourseCurriculums,
	getUFCourses,
	getUFCurriculumComponents,
	type UFComponent,
	type UFCourseCurriculum,
} from '@/services/ufabc-parser';
import { transformCourseName, type Course } from '@/utils/transform-course';
import { capitalizeStr } from '@/utils/capitalize-Str';
import { getStudentHistory } from '@/services/next';
import { scrapeClassesPage } from './classes-page';

type SigStudent = {
	matricula: string;
	email: string;
	/** @example 2022:2 */
	entrada: string;
	nivel: 'graduacao' | 'licenciatura';
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
	grade: 'A' | 'B' | 'C' | 'D' | 'O' | 'F' | 'E' | null;
	status: string;
	year: string;
	period: '1' | '2' | '3';
	credits: number;
};

export type HydratedComponent = SigComponent & {
	category: 'free' | 'mandatory' | 'limited';
};

export type Student = {
	name: string;
	ra: string;
	login: string;
  studentId?: number | undefined
	email: string | undefined;
	graduations: Array<{
		course: Course;
		campus: string;
		shift: string;
		grade: string;
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
			normalizeDiacritics(column.innerText ?? ''),
		);
		return cleaned;
	});

	const rawStudent: SigStudent = Object.fromEntries(kvStudent);
	const [course, campus, kind, shift] = rawStudent.curso.split('  ');
	const NTIStudent = await getUFStudent(rawStudent.matricula);
	if (!NTIStudent) {
		console.log('could not extract student', NTIStudent);
		return null;
	}
	const fixedShift = shift === 'n' ? 'noturno' : 'matutino';
	const name = capitalizeStr(NTIStudent.fullname);

	const student = {
		name,
		ra: rawStudent.matricula,
		login: NTIStudent.username,
		email: NTIStudent.email.find((email) =>
			email.includes('@aluno.ufabc.edu.br'),
		),
		graduations: [
			{
				course: transformCourseName(course, kind),
				campus: campus === 'santo andre' ? 'sa' : 'sbc',
				shift: fixedShift,
			},
		],
		startedAt: rawStudent.entrada,
	};

	return student;
}

export async function scrapeMenu(
	trs: NodeListOf<HTMLTableRowElement>,
): Promise<Student | null> {
	const { data: page, error } = await fetchGrades();
	if (error || !page) {
		console.log({
			msg: 'Ocorreu um erro ao extrair as disciplinas cursadas, por favor tente novamente mais tarde!',
			error,
		});
		return null;
	}

	const { data: classesPage, error: classesError } = await fetchClasses();
	if (classesError || !classesPage) {
		console.log({
			msg: 'Ocorreu um erro ao extrair as turmas, por favor tente novamente mais tarde!',
			error,
		});
		return null;
	}

	const classesData = scrapeClassesPage(classesPage);

	const shallowStudent = await retrieveStudent(trs);

	if (!shallowStudent || !classesData) {
		return null;
	}

	const graduationHistory = scrapeStudentHistory(page, classesData);
	const courses = await getUFCourses();
	const currentGraduation = shallowStudent.graduations[0]; // We only have one graduation per screen
	const studentGraduation = courses.find(
		(course) =>
		  // @ts-ignore
			course.name.toLowerCase() === currentGraduation.course.toLowerCase(),
	);
	if (!studentGraduation) {
		console.log('error finding student graduation', currentGraduation);
		return null;
	}

  const UFCourseIdList = Array.isArray(studentGraduation.UFCourseId) ? studentGraduation.UFCourseId : [studentGraduation.UFCourseId]
  const graduationCurriculums = await getUFCourseCurriculums(
		UFCourseIdList[0],
	);
	const curriculumByRa = await resolveCurriculum(
		shallowStudent.ra,
		graduationCurriculums,
	);
	if (!curriculumByRa) {
		console.log('could not get curriculum', curriculumByRa);
		return null;
	}

	if (!graduationHistory) {
		console.log('error scrapping student history', graduationHistory);
		return null;
	}

	const curriculumComponents = await getUFCurriculumComponents(
		UFCourseIdList[0],
		curriculumByRa?.grade,
	);

	const components = graduationHistory.map((component) =>
		hydrateComponents(component, curriculumComponents.components),
	);

	const graduation = {
		course: currentGraduation.course,
		campus: currentGraduation.campus,
		grade: curriculumByRa.grade,
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

function scrapeStudentHistory(
	page: string,
	classesData: { name: string; credits: number }[],
) {
	const parser = new DOMParser();
	const gradesDocument = parser.parseFromString(page, 'text/html');
	if (!gradesDocument.body) {
		console.log('could not mount document', document);
		return null;
	}

	const $periodsTable =
		gradesDocument.querySelectorAll<HTMLTableElement>('.tabelaRelatorio');
	const historyTables = Array.from($periodsTable);
	const components = historyTables.flatMap((h) =>
		extractComponents(h, classesData),
	);

	return components;
}

function extractComponents(
	table: HTMLTableElement,
	classesData: { name: string; credits: number }[],
) {
	const caption = table.querySelector('caption')?.textContent?.trim() || '';
	const [year, period] = caption.split('.') as [string, '1' | '2' | '3'];
	const headers = extractHeaders(table);
	const rows = Array.from(
		table.querySelectorAll<HTMLTableRowElement>('tbody > tr'),
	);
	const components = rows.map((row) => {
		const cells = Array.from(row.children) as unknown as HTMLTableColElement[];
		const component = {
			year,
			period,
		} as SigComponent;

		headers.forEach((header, index) => {
			switch (header) {
				case 'codigo':
					component.UFCode = cells[index].innerText;
					break;
				case 'disciplina':
					component.name = cells[index].innerText;
					break;
				case 'resultado': {
					const gradeCell = cells.find(
						(cell) =>
							cell.classList.contains('nota') && cell.innerText.trim() !== '',
					);
					component.grade = gradeCell
						? (gradeCell.innerText.trim() as SigComponent['grade'])
						: null;
					break;
				}
				case 'situacao': {
					const statusCell = cells[cells.length - 1];
					component.status = statusCell ? statusCell.innerText.trim() : '';
					break;
				}
			}
		});

		const matchComponent = classesData.find((c) => c.name === component.name);

		return { ...component, credits: matchComponent?.credits };
	});

	return components;
}

function extractHeaders(table: HTMLTableElement) {
	const headerCells = Array.from(table.querySelectorAll('th'));
	const wantedFields = ['codigo', 'disciplina', 'resultado', 'situacao'];
	return headerCells
		.map((cell) => normalizeDiacritics(cell.innerText))
		.filter((header) => wantedFields.includes(header));
}

async function resolveCurriculum(
	ra: string,
	curriculums: UFCourseCurriculum[],
) {
	const history = await getStudentHistory(Number(ra));

  if (!history || !history.grade) {
	  return curriculums.at(-1);
  }

  const currentCurriculum = curriculums.find(
    (curriculum) => curriculum.grade === history.grade,
  );
  return currentCurriculum;
}

function hydrateComponents(
	sigComponent: SigComponent,
	curriculumComponents: UFComponent[],
): HydratedComponent {
	const match = curriculumComponents.find(
		(c) => c.name === sigComponent.name.toLocaleLowerCase(),
	);
	if (!match) {
		return {
			...sigComponent,
			name: sigComponent.name.toLocaleLowerCase(),
      category: 'free',
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
