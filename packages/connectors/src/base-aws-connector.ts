import type { Client, MetadataBearer } from '@aws-sdk/types';

type AWSClient = Pick<Client<object, MetadataBearer, unknown>, 'destroy'>;

export abstract class BaseAWSConnector<TClient extends AWSClient> {
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
