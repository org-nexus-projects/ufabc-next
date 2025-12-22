import { BaseRequester } from './base-requester.js';

type MoodleResponse = {
  error: boolean;
  exception?: Record<string, unknown>;
  data: Record<string, unknown>;
};

type MoodleComponentData = {
  id: number;
  fullname: string;
  shortname: string;
  idnumber: string;
  summary: string;
  summaryformat: string;
  startdate: number;
  enddate: number;
  visible: boolean;
  showactivitydates: boolean;
  showcompletionconditions: boolean | null;
  fullnamedisplay: string;
  viewurl: string;
  courseimage: string;
  progress: number;
  hasprogress: boolean;
  isfavourite: boolean;
  hidden: number;
  showshortname: boolean;
  coursecategory: string;
};

export type MoodleComponent = {
  error: boolean;
  data: {
    courses: MoodleComponentData[];
    nextoffset: number;
  };
};

export class MoodleConnector extends BaseRequester {
  constructor() {
    super('https://moodle.ufabc.edu.br');
  }

  async validateToken(sessionId: string, sessKey: string) {
    const body = [
      {
        index: 0,
        methodname:
          'core_course_get_enrolled_courses_by_timeline_classification',
        args: { offset: 0, limit: 1, classification: 'all' },
      },
    ];

    const headers = new Headers();
    headers.set('Cookie', `MoodleSession=${sessionId}`);
    headers.set('Content-Type', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');

    const response = await this.request<Array<MoodleResponse>>(
      '/lib/ajax/service.php?',
      {
        method: 'POST',
        query: {
          sesskey: sessKey,
        },
        headers,
        body,
        timeout: 5_000,
      },
    );

    return response;
  }

  async getComponents(sessionId: string, sessKey: string) {
    const headers = new Headers();
    headers.set('Cookie', `MoodleSession=${sessionId}`);

    const response = await this.request<Array<MoodleComponent>>(
      '/lib/ajax/service.php',
      {
        method: 'POST',
        query: {
          sesskey: sessKey,
        },
        headers,
        credentials: 'include',
        body: [
          {
            index: 0,
            methodname:
              'core_course_get_enrolled_courses_by_timeline_classification',
            args: { offset: 0, limit: 0, classification: 'all' },
          },
        ],
      },
    );
    return response;
  }
}
