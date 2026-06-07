import { BaseRequester, type TraceProvider } from './base-requester.js';

export class UfabcMatriculaConnector extends BaseRequester {
  constructor(traceProvider?: TraceProvider) {
    super('https://matricula.ufabc.edu.br', traceProvider);
  }

  async validateToken(sessionId: string) {
    // TOOD: finish
  }
}
