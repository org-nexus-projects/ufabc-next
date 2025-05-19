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
        kind: kind, 
        season:season,
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
