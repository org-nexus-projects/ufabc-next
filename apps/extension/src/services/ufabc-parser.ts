import { UfabcParserConnector, type UFSeasonComponents } from '@next/connectors/ufabc-parser';

export type UFComponent = {
	name: string;
	UFComponentCode: string;
	category: "limited" | "mandatory";
	credits: number;
};

export type Student = ShallowStudent & {
  sessionId: string
}

type Course = string;

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

const baseURL = (import.meta as any).env.VITE_UFABC_PARSER_URL as string;

const parser = new UfabcParserConnector({
	baseURL,
	requesterKey: "ufabc-next",
});

export async function getUFEnrolled() {
	const enrolled = await parser.getEnrolled();

	const result: Record<number, string[]> = {};
	for (const componentId in enrolled) {
		const studentIds = enrolled[componentId];

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
	return parser.getAllComponents();
}
