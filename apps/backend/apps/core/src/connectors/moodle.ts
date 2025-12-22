import { BaseRequester } from './base-requester.js';

type MoodleResponse = {
  error: boolean;
  exception?: Record<string, unknown>;
  data: Record<string, unknown>;
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
}
