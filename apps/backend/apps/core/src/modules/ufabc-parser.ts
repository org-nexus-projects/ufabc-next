import type {
  ParsedSigStudent,
  SigStudent,
} from '@/schemas/entities/students.js';
import { ofetch } from 'ofetch';
import { logger } from '@/utils/logger.js';
import { sigHistory, type SigHistory } from '@/schemas/history.js';

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
  UFClassroomCode: string;
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
  shift: 'morning' | 'night';
  class: string;
  campus: 'sa' | 'sbc';
  original: string;
  errors: string[];
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
  UFClassroomCode: string;
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
  onResponseError({ response, error }) {
    logger.error(
      {
        error,
        response,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        data: response._data,
      },
      'ufabc-parser',
      'ufabc-parser error',
    );
  },
  onRequestError({ request, error, response }) {
    logger.error(
      {
        error,
        request,
        response,
        status: response?.status,
        statusText: response?.statusText,
        url: response?.url,
        data: response?._data,
      },
      'ufabc-parser',
      'ufabc-parser error',
    );
  },
});

export async function getSigUser(sigStudent: SigStudent, sessionId: string) {
  const student = await ufabcParserService<{
    data: ParsedSigStudent | null;
    error: string | null;
  }>('/sig/me', {
    method: 'POST',
    headers: {
      sessionId,
    },
    query: {
      action: 'default',
    },
    body: sigStudent,
  });
  return student;
}

type FullStudentRequest = {
  student: ParsedSigStudent & { grade: string };
  action: string;
  viewState: string;
  sessionId: string;
};

export async function getFullStudent({
  student,
  action,
  viewState,
  sessionId,
}: FullStudentRequest) {
  const fullStudent = await ufabcParserService<{
    data: ParsedSigStudent | null;
    error: string | null;
  }>('/sig/grades', {
    method: 'POST',
    headers: {
      sessionId,
      viewState,
    },
    body: {
      student,
      action,
    },
  });
  return fullStudent;
}

export async function getHistory(sessionId: string, viewState: string) {
  const rawHistory = await ufabcParserService<{
    data: SigHistory | null;
    error: string | null;
  }>('/sig/history', {
    method: 'POST',
    headers: {
      sessionId,
      viewState,
    },
    query: {
      action: 'history',
    },
  });

  const parsedHistory = sigHistory.safeParse(rawHistory.data);

  return parsedHistory;
}

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
        season,
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

export async function getComponentsFile(season: string, kind: string) {
  const componentsFile = await ufabcParserService<UFProcessorComponentFile[]>(
    '/v2/matriculas/components/file',
    {
      query: {
        season,
        granted: false,
        kind,
      },
    },
  );

  return componentsFile;
}

export async function getComponentsV2(season: string) {
  const components = await ufabcParserService<UfabcParserComponentV2[]>(
    '/v2/matriculas/components/file',
    {
      query: {
        season,
        granted: true,
        kind: 'settlement',
      },
    },
  );
  return components;
}
