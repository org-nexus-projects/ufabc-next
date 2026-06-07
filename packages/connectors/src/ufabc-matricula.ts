import { BaseRequester } from './base-requester.js';

let ufabcMatriculaConnectorInstance: UfabcMatriculaConnector | null = null;

export class UfabcMatriculaConnector extends BaseRequester {
  constructor(traceId?: string) {
    if (ufabcMatriculaConnectorInstance) {
      return ufabcMatriculaConnectorInstance;
    }

    super({ baseURL: 'https://matricula.ufabc.edu.br', globalTraceId: traceId });
    ufabcMatriculaConnectorInstance = this;
  }

  async validateToken(sessionId: string) {
    // TOOD: finish
  }
}
