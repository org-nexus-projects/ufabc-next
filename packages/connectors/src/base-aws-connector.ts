import type { Client } from '@aws-sdk/types';

export abstract class BaseAWSConnector<TClient extends Client<any, any, any>> {
  protected readonly client: TClient;
  protected readonly traceId?: string;

  constructor(client: TClient, traceId?: string) {
    this.client = client;
    this.traceId = traceId;
  }

  protected getTraceId(): string {
    return this.traceId ?? globalThis.crypto.randomUUID();
  }
}
