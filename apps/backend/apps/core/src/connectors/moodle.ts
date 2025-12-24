import { ofetch } from 'ofetch';
import { BaseRequester } from './base-requester.js';
import { setTimeout as sleep } from 'node:timers/promises';

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

  async getComponentContentsPage(sessionId: string, url: string, id: string) {
    const headers = new Headers();
    headers.set('Cookie', `MoodleSession=${sessionId}`);

    const response = await this.request<string>(url, {
      headers,
      credentials: 'include',
      responseType: 'text',
      query: {
        id,
      },
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

  async validatePdfLink(url: string, sessionId: string) {
    await this.rateLimit();

    try {
      // Use ofetch directly with native response to get headers and final URL
      let finalUrl = url;
      let contentType: string | null = null;

      await ofetch.raw(url, {
        method: 'HEAD',
        headers: {
          Cookie: `MoodleSession=${sessionId}`,
        },
        retry: 1,
        retryDelay: 500,
        timeout: 10000,
        onResponse({ response }) {
          // Capture the final URL after redirects
          finalUrl = response.url || url;
          contentType = response.headers.get('content-type');
        },
      });

      const isPdf =
        // @ts-expect-error - contentType is a string
        contentType?.includes('application/pdf') ||
        finalUrl.toLowerCase().endsWith('.pdf');

      return {
        isPdf,
        finalUrl: isPdf ? finalUrl : undefined,
      };
    } catch (error) {
      // Some servers don't support HEAD requests, try GET with range header
      try {
        let finalUrl = url;
        let contentType: string | null = null;

        await ofetch.raw(url, {
          method: 'GET',
          headers: {
            Cookie: `MoodleSession=${sessionId}`,
            Range: 'bytes=0-0', // Only get first byte
          },
          retry: 0,
          timeout: 10000,
          onResponse({ response }) {
            finalUrl = response.url || url;
            contentType = response.headers.get('content-type');
          },
        });

        const isPdf =
          // @ts-expect-error - contentType is a string
          contentType?.includes('application/pdf') ||
          finalUrl.toLowerCase().endsWith('.pdf');

        return {
          isPdf,
          finalUrl: isPdf ? finalUrl : undefined,
        };
      } catch {
        // If both fail, it's likely not accessible or not a PDF
        return { isPdf: false, finalUrl: undefined };
      }
    }
  }
}
