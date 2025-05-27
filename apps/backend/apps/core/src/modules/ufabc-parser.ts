import { ofetch } from 'ofetch';

export type UfabcParserComponent = {
  /** The id as we consume */
  UFComponentId: number;
  /** The code as we consume */
  UFComponentCode: string;
  campus: 'sbc' | 'sa';
  name: string;
  turma: string;
  turno: 'diurno' | 'noturno';
  credits: number;
  courses: Array<{
    name: string | '-';
    UFCourseId: number;
    category: 'limitada' | 'obrigatoria';
  }>;
  vacancies: number;
  hours: Record<string, { periodicity: string; classPeriod: string[] }>[];
};

type Weekdays =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

type ComponentHours = {
  [key in Weekdays]?: {
    periodicity: 'weekly' | 'biweekly';
    classPeriod: string[];
  };
};

export type UfabcParserComponentV2 = {
  UFComponentId: number;
  class: string;
  shift: 'morning' | 'night';
  vacancies: number;
  campus: 'sa' | 'sbc';
  hours: ComponentHours;
  tpi: {
    theory: number;
    practice: number;
    individual: number;
  };
  courses: Array<{
    category: string;
    UFCourseId: number;
    name?: string;
  }>;
  UFComponentCode: string;
  name: string;
  credits: number;
  teachers: {
    professor?: string;
    practice?: string;
    secondaryPractice?: string;
    secondaryProfessor?: string;
  };
  season: string;
};

type StudentRA = string;
export type StudentComponent = {
  code: string;
  name: string | null;
  errors: string[] | [];
};
export type UFProcessorEnrollment = Record<StudentRA, StudentComponent[]>;

type ComponentId = number;
type StudentIds = number;
export type UFProcessorEnrolled = Record<ComponentId, StudentIds[]>;

export type UFProcessorComponentFile = {
  /** The id as we consume */
  UFComponentId: '-' | number;
  /** The code as we consume */
  UFComponentCode: string;
  campus: 'sbc' | 'sa';
  name: string;
  turma: string;
  turno: 'diurno' | 'noturno';
  credits: number;
  tpi: [number, number, number];
  enrolled: number[];
  vacancies: number;
  /** The courses that are available for this component */
  courses: Array<{
    name: string | '-';
  }>;
  teachers: {
    practice: string | null;
    secondaryPractice: string | null;
    professor: string | null;
    secondaryProfessor: string | null;
  };
  hours: Record<string, { periodicity: string; classPeriod: string[] }>[];
};

export const ufabcParserService = ofetch.create({
  baseURL: process.env.UFABC_PARSER_URL,
  timeout: 45 * 1000, // 45 seconds,
});

export async function getComponents() {
  const components =
    await ufabcParserService<UfabcParserComponent[]>('/components');
  return components;
}

export async function getEnrollments(kind: string, season: string) {
  const enrollments = await ufabcParserService<UFProcessorEnrollment>(
    '/enrollments',
    {
     query: {
        kind, 
        season ,
        granted: true,  
      },

    },
  );
  return enrollments;
}

export async function getEnrolledStudents() {
  const enrolled = await ufabcParserService<UFProcessorEnrolled>('/enrolled');
  return enrolled;
}

export async function getComponentsFile(link: string) {
  const componentsFile = await ufabcParserService<UFProcessorComponentFile[]>(
    '/componentsFile',
    {
      query: {
        link,
      },
    },
  );

  return componentsFile;
}

export async function getComponentsV2(season: string) {
  const components = await ufabcParserService<UfabcParserComponentV2[]>(
    '/v2/components',
    {
      query: {
        season,
      },
    },
  );
  return components;
}
