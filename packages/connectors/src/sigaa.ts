import { BaseRequester, type TraceProvider } from './base-requester.js';

export class SigaaConnector extends BaseRequester {
  constructor(traceProvider?: TraceProvider) {
    super('https://sig.ufabc.edu.br', traceProvider);
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
