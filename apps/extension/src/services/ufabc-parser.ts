import { ofetch } from "ofetch";

export type UFComponent = {
	name: string;
	UFComponentCode: string;
	category: "limited" | "mandatory";
	credits: number;
};

export type UFSeasonComponents = {
	UFComponentId: number
	UFComponentCode: string;
	name: string
	campus: 'sbc' | 'sa'
	turma: string
	turno: 'diurno' | 'noturno'
	credits: number
	vacancies: number
	courses: Array<{ name: string; UFCourseId: number; category: 'limited' | 'mandatory' }>
	hours: unknown
}

type Action = 'history' | 'student-report' | 'student'

type Student = ShallowStudent & {
  sessionId: string
}

type SigStudent = {
	matricula: string;
	email: string;
	/** @example 2022:2 */
	entrada: string;
	nivel: 'graduacao' | 'licenciatura';
	status: string;
	curso: string;
	sessionId: string;
};

export type ShallowStudent = {
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

type HydratedComponent = SigComponent & {
	category: 'free' | 'mandatory' | 'limited';
};

export type CompleteStudent = {
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
    UFCourseId: number;
		components: HydratedComponent[];
	}>;
	startedAt: string;
	lastUpdate: number;
};

const ufParserService = ofetch.create({
	baseURL: import.meta.env.VITE_UFABC_PARSER_URL,
});

export async function getUFEnrolled() {
	const enrolled =
		await ufParserService<Record<string, Array<number>>>("/enrolled");

	const result: Record<number, string[]> = {};
	for (const componentId in enrolled) {
		const studentIds = enrolled[Number(componentId)];

		for (const studentId of studentIds) {
			if (!result[studentId]) {
				result[studentId] = [];
			}
			result[studentId].push(componentId);
		}
	}

	return result;
}

export async function getUFComponents() {
	const ufComponents = await ufParserService<UFSeasonComponents[]>("/components");
	return ufComponents
}

export async function getStudentGrades(student: Student, viewStateID: string, action: Action) {
	const $grades = await ufParserService<{ data: CompleteStudent | null; error: string | null }>('/sig/grades', {
    method: 'POST',
		query: {
			token: student.sessionId,
			action,
      viewState: viewStateID
		},
    body: student
	});
	return $grades;
}

export async function getStudentSigHistory(sessionId: string, viewStateID: string, action: Action) {
	const $history = await ufParserService<{ data: string | null; error: string | null }>('/sig/history', {
		query: {
			token: sessionId,
			action,
      viewState: viewStateID
		}
	});
	return $history;
}

export async function getStudentSig(student: SigStudent, action: Action) {
	const $student = await ufParserService<{ data: ShallowStudent | null; error: string | null }>('/sig/me', {
		method: 'POST',
		body: student,
		query: {
			action,
		},
		headers: {
			sessionId: student.sessionId,
		},
	});
	return $student;
}