import { currentQuad } from '@next/common';
import { BaseRequester } from './base-requester.js';

type ComponentId = number;
type StudentIds = number;
export type UFProcessorEnrolled = Record<ComponentId, StudentIds[]>;

type StudentRA = string;
type StudentComponent = {
  code: string;
  name: string | null;
  shift: 'morning' | 'night';
  class: string;
  campus: 'sa' | 'sbc';
  original: string;
  errors: string[];
};
type UFProcessorEnrollment = Record<StudentRA, StudentComponent[]>;

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
}
