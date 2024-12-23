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
		neurociencia: "Bacharelado em Neurociência",
		matematica: "Bacharelado em Matemática",
		kind: {
			matematica: "Licenciatura em Matemática",
		},
	},
	cecs: {
		economicas: "Bacharelado em Ciências Econômicas",
		aeroespacial: "Engenharia Aeroespacial",
		ambiental: "Engenharia Ambiental e Urbana",
		biomedica: "Engenharia Biomédica",
		energia: "Engenharia de Energia",
		gestao: "Engenharia de Gestão",
		informacao: "Engenharia de Informação",
		robotica: "Engenharia de Instrumentação, Automação e Robótica",
		materiais: "Engenharia de Materiais",
		territorial: "Bacharelado em Planejamento Territorial",
		politicas: "Bacharelado em Políticas Públicas",
		internacionais: "Bacharelado em Relações Internacionais",
	},
	ccnh: {
		kind: {
			quimica: "Licenciatura em Química",
			filosofia: "Licenciatura em Filosofia",
			biologicas: "Licenciatura em Ciências Biológicas",
			física: "Licenciatura em Física",
		},
		biologicas: "Bacharelado em Ciências Biológicas",
		filosofia: "Bacharelado em Filosofia",
		fisica: "Bacharelado em Física",
		quimica: "Bacharelado em Química",
	},
} as const;

export function transformCourseName(course: string, kind: string) {
	const [name, agency, type] = course.toLowerCase().split("/") as SigaaCourseSplitted;
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
