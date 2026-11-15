import { setTimeout as sleep } from 'node:timers/promises';

import { BaseRequester } from './base-requester.ts';

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
  private lastRequestTime = 0;
  private readonly minRequestInterval = 300;

  constructor(baseURL: string, traceId?: string) {
    super({ baseURL, globalTraceId: traceId });
  }

  async validateToken(sessionId: string, sessKey: string) {
    const body = [
      {
        args: { classification: 'all', limit: 1, offset: 0 },
        index: 0,
        methodname:
          'core_course_get_enrolled_courses_by_timeline_classification',
      },
    ];

    const headers = new Headers();
    headers.set('Cookie', `MoodleSession=${sessionId}`);
    headers.set('Content-Type', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');

    const response = await this.request<MoodleResponse[]>(
      '/lib/ajax/service.php?',
      {
        body,
        headers,
        method: 'POST',
        query: {
          sesskey: sessKey,
        },
        timeout: 5000,
      }
    );

    return response;
  }

  async getComponents(sessionId: string, sessKey: string) {
    const headers = new Headers();
    headers.set('Cookie', `MoodleSession=${sessionId}`);

    const response = await this.request<MoodleComponent[]>(
      '/lib/ajax/service.php',
      {
        body: [
          {
            args: { classification: 'all', limit: 0, offset: 0 },
            index: 0,
            methodname:
              'core_course_get_enrolled_courses_by_timeline_classification',
          },
        ],
        credentials: 'include',
        headers,
        method: 'POST',
        query: {
          sesskey: sessKey,
        },
      }
    );
    return response;
  }

  async getComponentContentsPage(sessionId: string, url: string, id: string) {
    const headers = new Headers();
    headers.set('Cookie', `MoodleSession=${sessionId}`);

    const response = await this.request<string, 'text'>(url, {
      credentials: 'include',
      headers,
      query: {
        id,
      },
      responseType: 'text',
    });

    return response;
  }

  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await sleep(delay);
    }

    this.lastRequestTime = Date.now();
  }

  async validatePdfLink(url: string, sessionId: string, sessionKey: string) {
    await this.rateLimit();

    try {
      let finalUrl = url;
      let contentType: string | null = null;

      const response = await this.requestRaw(url, {
        headers: {
          Cookie: `MoodleSession=${sessionId}`,
          sesskey: sessionKey,
        },
        method: 'HEAD',
        retry: 1,
        retryDelay: 500,
        timeout: 10_000,
      });

      finalUrl = response.url === '' ? url : response.url;
      contentType = response.headers.get('Content-Type');

      const isPdf =
        contentType?.includes('application/pdf') === true ||
        finalUrl.toLowerCase().endsWith('.pdf');

      return {
        finalUrl: isPdf ? finalUrl : undefined,
        isPdf,
      };
    } catch {
      // Some servers don't support HEAD requests, try GET with range header
      try {
        let finalUrl = url;
        let contentType: string | null = null;

        const response = await this.requestRaw(url, {
          credentials: 'include',
          headers: {
            Cookie: `MoodleSession=${sessionId}`,
            Range: 'bytes=0-0',
            sesskey: sessionKey,
          },
          method: 'GET',
          retry: 0,
          timeout: 10_000,
        });

        finalUrl = response.url === '' ? url : response.url;
        contentType = response.headers.get('Content-Type');

        const isPdf =
          contentType?.includes('application/pdf') === true ||
          finalUrl.toLowerCase().endsWith('.pdf');

        return {
          finalUrl: isPdf ? finalUrl : undefined,
          isPdf,
        };
      } catch {
        // If both fail, it's likely not accessible or not a PDF
        return { finalUrl: undefined, isPdf: false };
      }
    }
  }
}
