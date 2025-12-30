import { BaseRequester } from './base-requester.js';


export class SigaaConnector extends BaseRequester {
  constructor() {
    super('https://sig.ufabc.edu.br');
  }

  async validateToken(sessionId: string) {
    const headers = new Headers();
    headers.set('Cookie', `JSESSIONID=${sessionId}`);
    const response = await this.request<string>('/sigaa/verMenuPrincipal.do', {
      headers,
    });
    return response;
  }
}
