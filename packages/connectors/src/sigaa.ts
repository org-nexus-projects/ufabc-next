import { BaseRequester } from './base-requester.ts';

export class SigaaConnector extends BaseRequester {
  constructor(baseURL: string, traceId?: string) {
    super({ baseURL, globalTraceId: traceId });
  }

  async validateToken(sessionId: string) {
    const headers = new Headers();
    headers.set('Cookie', `JSESSIONID=${sessionId}`);
    const response = await this.request<string>('/sigaa/verMenuPrincipal.do', {
      headers,
      retry: 3,
      retryStatusCodes: [429],
      retryDelay: 1000,
    });
    return response;
  }
}
