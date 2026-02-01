import { currentQuad } from '@next/common';

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

type Timetable = {
  dayOfTheWeek:
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';
  periodicty: 'weekly' | 'biweekly';
  startTime: string;
  endTime: string;
};

type UfabcParserComponentV2 = {
  componentKey: string;
  subjectKey: string;
  name: string;
  credits: number;
  ufComponentId: number;
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
  courses: Array<{
    name: string | '-';
    UFCourseId: number;
    category: 'limited' | 'mandatory';
  }>;
  timetable: Timetable[];
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
  
}
