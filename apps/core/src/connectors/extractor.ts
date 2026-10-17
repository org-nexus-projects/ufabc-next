import { BaseRequester } from './base-requester.js';

type ExtractorConnectorOptions = {
  baseUrl: string;
  token: string;
  internalToken: string;
  globalTraceId?: string;
};

export class ExtractorConnector extends BaseRequester {
  protected override readonly redactRequestBody = true;
  private readonly serviceToken: string;
  private readonly internalToken: string;
  private readonly headers: Record<string, string>;

  constructor({
    baseUrl,
    token,
    internalToken,
    globalTraceId,
  }: ExtractorConnectorOptions) {
    super(baseUrl, globalTraceId);
    this.serviceToken = token;
    this.internalToken = internalToken;
    this.headers = {
      'x-internal-token': this.internalToken,
      'x-service-id': this.serviceToken,
    };
  }

  async extractArchive(pdfUrl: string) {
    const response = await this.request('/extract', {
      body: { pdfUrl },
      headers: this.headers,
      method: 'POST',
    });
    return response;
  }

  async summarizeComments(comments: string[]) {
    const response = await this.request('/summarize', {
      body: { comments },
      headers: this.headers,
      method: 'POST',
    });
    return response;
  }
}
