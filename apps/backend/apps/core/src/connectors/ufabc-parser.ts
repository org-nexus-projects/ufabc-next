import { currentQuad } from '@next/common';

import { UfabcParserError } from '@/errors/ufabc-parser.js';
import { sigHistory, type SigHistory } from '@/schemas/history.js';

import { BaseRequester } from './base-requester.js';

type ComponentId = number;
type StudentIds = number;
export type UFProcessorEnrolled = Record<ComponentId, StudentIds[]>;

export type UfabcParserComponent = {
  /** The id as we consume */
  UFComponentId: number;
  /** The code as we consume */
  UFComponentCode: string;
  UFClassroomCode: string;
  rawTPI: [number, number, number];
  campus: 'sbc' | 'sa';
  name: string;
  class: string;
  shift: 'morning' | 'night';
  credits: number;
  courses: Array<{
    name: string | '-';
    UFCourseId: number;
    category: 'limited' | 'mandatory';
  }>;
  vacancies: number;
  hours: Record<string, { periodicity: string; classPeriod: string[] }>[];
  tpi: {
    theory: number;
    practice: number;
    individual: number;
  } | null;
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

type UfabcParserComponentV2 = {
  componentKey: string;
  subjectKey: string;
  name: string;
  credits: number;
  ufComponentId: number;
  alternateUfabcComponentId: number | null;
  ufComponentCode: string;
  campus: 'sbc' | 'sa';
  shift: 'morning' | 'night';
  vacancies: number;
  componentClass: string;
  season: string;
  ufClassroomCode: string;
  tpi: {
    theory: number;
    practice: number;
    individual: number;
  };
  timetable: Array<{
    dayOfTheWeek: string;
    startTime: string;
    endTime: string;
    periodicity: string;
    classroomCode: string | null;
    scheduleType: string | null;
    frequency: string | null;
    unparsed: string | null;
  }>;
  courses: Array<{
    UFCourseId: number;
    category: 'limited' | 'mandatory';
  }> | null;
  teachers: Array<{
    name: string;
    role: 'professor' | 'practice';
    isSecondary: boolean;
  }>;
};

type SyncStudentParams = {
  sessionId: string;
  viewId: string;
  requesterKey: string;
};

export class UfabcParserConnector extends BaseRequester {
  constructor(globalTraceId?: string) {
    super(process.env.UFABC_PARSER_URL, globalTraceId);
  }

  async getHistory(sessionId: string, viewState: string) {
    const headers = new Headers();
    headers.set('session-id', sessionId);
    headers.set('view-state', viewState);
    const response = await this.request<{
      data: SigHistory | null;
      error: string | null;
    }>('/v1/sig/history', {
      method: 'POST',
      headers,
      query: {
        action: 'history',
      },
    });

    const parsedHistory = sigHistory.safeParse(response.data);
    return parsedHistory;
  }

  async getComponents() {
    const response = await this.request<UfabcParserComponent[]>(
      '/v1/matriculas/ufabc'
    );
    return response;
  }

  async getEnrollments(kind: string, season: string) {
    const enrollments = await this.request<UFProcessorEnrollment>(
      '/enrollments',
      {
        query: {
          kind,
          season,
          granted: true,
        },
      }
    );
    return enrollments;
  }

  async getComponentsFile(season: string, kind: string) {
    const componentsFile = await this.request<UFProcessorComponentFile[]>(
      '/v2/matriculas/components/file',
      {
        query: {
          season,
          granted: false,
          kind,
        },
      }
    );

    return componentsFile;
  }

  async getComponentsV2(season: string) {
    const components = await this.request<UfabcParserComponentV2[]>(
      '/v2/components',
      {
        query: {
          season,
        },
      }
    );

    return components;
  }

  async getEnrolled(componentId?: number) {
    const response = await this.request<UFProcessorEnrolled>(
      '/v2/components/enrolled',
      {
        query: {
          componentId,
        },
      }
    );
    return response;
  }

  async getComponent(ufComponentId: number) {
    const season = currentQuad();
    const response = await this.request<UfabcParserComponentV2[]>(
      '/v2/components',
      {
        query: {
          ufComponentId,
          season,
        },
      }
    );
    return response;
  }

  async syncStudent(params: SyncStudentParams) {
    const { sessionId, viewId, requesterKey } = params;
    const headers = new Headers();
    headers.set('session-id', sessionId);
    headers.set('view-state', viewId);
    headers.set('requester-key', requesterKey);
    const response = await this.request<{
      message: string;
    }>('/v2/students', {
      method: 'POST',
      headers,
    });
    return response;
  }

  async getStudentHistory(login: string) {
    const headers = new Headers();
    headers.set('requester-key', process.env.UFABC_PARSER_REQUESTER_KEY!);

    const response = await this.request<any>(
      `/v2/students/${login}/formatted`,
      {
        headers,
      }
    );
    return response;
  }

  async getStudent(ra: string) {
    const headers = new Headers();
    headers.set('requester-key', process.env.UFABC_PARSER_REQUESTER_KEY!);

    try {
      const response = await this.request<{
        studentKey: string;
        login: string;
        email: string[];
        metadata: Record<string, unknown>;
        ra: string;
      }>(`/v2/students/${ra}`, {
        headers,
        query: {
          simplified: true
        }
      });
      return response;
    } catch (error: any) {
      if (error.status === 404) {
        throw new UfabcParserError({
          status: 404,
          code: 'UFP0015',
          title: 'Student not found',
          description: 'O RA digitado não existe.',
        });
      }
      if (error.status === 403) {
        throw new UfabcParserError({
          status: 403,
          code: 'UFP0031',
          title: 'Teacher contract',
          description: 'O aluno não pode ter contrato com a UFABC.',
        });
      }
      throw error;
    }
  }

  async getTeacher(login: string) {
    const headers = new Headers();
    headers.set('requester-key', process.env.UFABC_PARSER_REQUESTER_KEY!);

    try {
      const response = await this.request<{
        teacherKey: string;
        name: string;
        aliases: string[];
        email: string[];
        room: string | null;
        metadata: Record<string, unknown>;
      }>(`/v2/teachers/login/${login}`, {
        headers,
      });
      return response;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }
}
