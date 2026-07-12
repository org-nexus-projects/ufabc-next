import { BaseRequester } from './base-requester.ts';

export class UfabcMatriculaConnector extends BaseRequester {
  constructor(baseURL: string, traceId?: string) {
    super({ baseURL, globalTraceId: traceId });
  }

  async validateToken(sessionId: string) {
    return true;
  }
}
