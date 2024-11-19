// little ts trick, it means the type can be of 'bi' or any other string
type UFABC_GRADUATION_TYPE = "bi" | (string & {});
type UFABC_GRADUATION_AGENCIES = keyof typeof KNOWN_COURSES;
type SigaaCourseSplitted = [
	string,
	UFABC_GRADUATION_AGENCIES,
	UFABC_GRADUATION_TYPE | undefined,
];

export type Course = ReturnType<typeof transformCourseName>;

const KNOWN_COURSES = {
	prograd: {
		bi: {
			tecnologia: "Bacharelado em Ciência e Tecnologia",
			default: "Bacharelado em Ciências e Humanidades",
		},
		humanas: "Licenciatura em Ciências Humanas",
		naturais: "Licenciatura em Ciências Naturais e Exatas",
	},
	cmcc: {
		computacao: "Bacharelado em Ciência da Computação",
		neurociência: "Bacharelado em Neurociência",
		matemática: "Bacharelado em Matemática",
		kind: {
			matemática: "Licenciatura em Matemática",
		},
	},
	cecs: {
		econômicas: "Bacharelado em Ciências Econômicas",
		aeroespacial: "Engenharia Aeroespacial",
		ambiental: "Engenharia Ambiental e Urbana",
		biomédica: "Engenharia Biomédica",
		energia: "Engenharia de Energia",
		gestão: "Engenharia de Gestão",
		informação: "Engenharia de Informação",
		robótica: "Engenharia de Instrumentação, Automação e Robótica",
		materiais: "Engenharia de Materiais",
		territorial: "Bacharelado em Planejamento Territorial",
		políticas: "Bacharelado em Políticas Públicas",
		internacionais: "Bacharelado em Relações Internacionais",
	},
	ccnh: {
		kind: {
			química: "Licenciatura em Química",
			filosofia: "Licenciatura em Filosofia",
			biológicas: "Licenciatura em Ciências Biológicas",
			física: "Licenciatura em Física",
		},
		biológicas: "Bacharelado em Ciências Biológicas",
		filosofia: "Bacharelado em Filosofia",
		física: "Bacharelado em Física",
		química: "Bacharelado em Química",
	},
} as const;

export function transformCourseName(course: string, kind: string) {
	const [name, agency, type] = course.split("/") as SigaaCourseSplitted;
	if (agency === "prograd") {
		if (type === "bi") {
			return name.includes("tecnologia")
				? KNOWN_COURSES.prograd.bi.tecnologia
				: KNOWN_COURSES.prograd.bi.default;
		}
		if (name.includes("humanas")) {
			return KNOWN_COURSES.prograd.humanas;
		}
		if (name.includes("naturais")) {
			return KNOWN_COURSES.prograd.naturais;
		}
	}

	if (agency === "cmcc") {
		for (const [keyword, coursename] of Object.entries(KNOWN_COURSES.cmcc)) {
			if (name.includes(keyword)) {
				return coursename;
			}
		}
	}

	if (agency === "cecs") {
		for (const [keyword, courseName] of Object.entries(KNOWN_COURSES.cecs)) {
			if (name.includes(keyword)) {
				return courseName;
			}
		}
	}

	if (agency === "ccnh") {
		if (kind === "licenciatura") {
			for (const [keyword, licentiateName] of Object.entries(
				KNOWN_COURSES.ccnh.kind,
			)) {
				if (name.includes(keyword)) {
					return licentiateName;
				}
			}
		}
		for (const [keyword, courseName] of Object.entries(KNOWN_COURSES.ccnh)) {
			if (name.includes(keyword)) {
				return courseName;
			}
		}
	}

	const unmappedCourseError = new Error("Course not mapped");
	throw new Error([name, agency, type].toString(), {
		cause: unmappedCourseError,
	});
}
