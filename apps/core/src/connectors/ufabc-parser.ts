import { UfabcParserError } from '@/errors/ufabc-parser.js';

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

type UfabcParserComponent = {
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

type UploadStudentHistoryParams = {
  login: string;
  requesterKey: string;
  file: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
  };
};

type UploadStudentHistoryResponse = {
  createdAt: string;
  studentKey: string;
  studentHistoryKey: string;
  result: unknown;
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

  async getComponentByKey(componentKey: string) {
    const response = await this.request<UfabcParserComponent[]>(
      '/v2/components',
      {
        query: {
          componentKey,
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

  async uploadStudentHistory(params: UploadStudentHistoryParams) {
    const { login, requesterKey, file } = params;
    const form = new FormData();
    form.append(
      'file',
      new Blob([file.buffer], { type: file.mimetype }),
      file.filename
    );

    const headers = new Headers();
    headers.set('requester-key', requesterKey);

    try {
      const response = await this.request<UploadStudentHistoryResponse>(
        `/v2/students/sync/${login}`,
        {
          method: 'POST',
          headers,
          body: form,
        }
      );
      return response;
    } catch (error: any) {
      if (error.status === 400) {
        throw new UfabcParserError({
          status: 400,
          code: 'UFP0002',
          title: 'Bad Request',
          description:
            'Não foi possível processar o arquivo enviado. Verifique se é o PDF correto do histórico.',
        });
      }
      if (error.status === 401) {
        throw new UfabcParserError({
          status: 401,
          code: 'UFP0001',
          title: 'Unauthorized',
          description: 'Envio direto de documento indisponível no momento.',
        });
      }
      throw error;
    }
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
          simplified: true,
        },
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

  async sendTeachers(teachers: string[]) {
    const headers = new Headers();
    headers.set('requester-key', process.env.UFABC_PARSER_REQUESTER_KEY!);

    try {
      await this.request(`/v2/teachers/routines/configure/manual`, {
        headers,
        method: 'POST',
        body: teachers,
      });
    } catch (error: any) {
      throw error;
    }
  }
}
