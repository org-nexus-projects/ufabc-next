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

export type Student = ShallowStudent & {
  sessionId: string
}


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

export async function getStudentSigHistory(sessionId: string, viewStateID: string, action: Action) {
  const headers = new Headers();

  headers.set('session-id', sessionId)
  headers.set('view-state', viewStateID)

  const $history = await ufParserService<{ data: string | null; error: string | null }>('/sig/history', {
		method: 'POST',
    query: {
			action,
		},
    headers,
	});
	return $history;
}
