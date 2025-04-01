import { ofetch } from "ofetch";
import { storage } from "wxt/storage";

type UFCourses = {
	name: string;
	campus: "santo andré" | "são bernardo do campo";
	coordinator: string;
	UFCourseId: number[];
};

export type UFCourseCurriculum =  {
  name: string;
  alias: string;
  grade: string;
  appliedAt: string;
  active: boolean;
  freeCredits: number | null;
  limitedCredits: number | null;
  mandatoryCredits: number | null;
  totalCredits: number | null
};

export type UFComponent = {
	name: string;
	UFComponentCode: string;
	category: "limited" | "mandatory";
	credits: number;
};

type UFCurriculumComponents = {
	name: string;
	alias: string;
	creditsTotal: number;
	limitedCredits?: number;
	campus: "sa" | "sbc";
	kind: "bacharelado" | "licenciatura";
	shift: "noturno" | "matutino";
	grade: string;
	components: UFComponent[];
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

const ufParserService = ofetch.create({
	baseURL: import.meta.env.VITE_UFABC_PARSER_URL,
});

const COURSES_CACHE = "ufCoursesCache";
const COURSE_CURRICULUM_CACHE = "ufCourseCurriculums";
const CURRICULUM_COMPONENTS_CACHE = "ufCurriculumComponents";

export async function getUFCourses() {
	// const cachedCourses = await storage.getItem<UFCourses[]>(
	// 	`session:${COURSES_CACHE}`,
	// );
	// if (cachedCourses) {
	// 	return cachedCourses;
	// }
	const courses = await ufParserService<UFCourses[]>("/courses");
	// await storage.setItem(`session:${COURSES_CACHE}`, courses);
	return courses;
}

export async function getUFCourseCurriculums(courseId: number) {
	// const cachedCurriculums = await storage.getItem<UFCourseCurriculum[]>(
	// 	`session:${COURSE_CURRICULUM_CACHE}`,
	// );
	// if (cachedCurriculums) {
	// 	return cachedCurriculums;
	// }

	const courseCurriculums = await ufParserService<UFCourseCurriculum[]>(
		`/courses/grades/${courseId}`,
	);
	await storage.setItem(
		`session:${COURSE_CURRICULUM_CACHE}`,
		courseCurriculums,
	);
	return courseCurriculums;
}

export async function getUFCurriculumComponents(
	courseId: number,
	curriculum: string,
) {
	// const cachedComponents = await storage.getItem<UFCurriculumComponents>(
	// 	`local:${CURRICULUM_COMPONENTS_CACHE}`,
	// );
	// if (cachedComponents) {
	// 	return cachedComponents;
	// }

	const curriculumComponents = await ufParserService<UFCurriculumComponents>(
		`/courses/components/${courseId}/${curriculum}`,
	);
	await storage.setItem(
		`local:${CURRICULUM_COMPONENTS_CACHE}`,
		curriculumComponents,
	);
	return curriculumComponents;
}

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

export async function getStudentGrades(sessionId: string) {

}