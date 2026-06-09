import { configureConnectors } from '@next/connectors/config';
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

try {
	const baseURL =
		typeof import.meta !== 'undefined'
			? (import.meta as any).env?.VITE_UFABC_PARSER_URL
			: undefined;

	configureConnectors({
		ufabcParser: {
			baseURL: baseURL || "https://ufabc-parser.com",
			requesterKey: "ufabc-next",
		},
	});
} catch {
	configureConnectors({
		ufabcParser: {
			baseURL: "https://ufabc-parser.com",
			requesterKey: "ufabc-next",
		},
	});
}

const parser = new UfabcParserConnector();

export async function getUFEnrolled() {
	const enrolled = await parser.getEnrolledLegacy();

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
