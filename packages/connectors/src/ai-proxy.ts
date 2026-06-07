import { BaseRequester } from './base-requester.js';

type Files = {
  url: string;
  name: string;
};

let aiProxyConnectorInstance: AIProxyConnector | null = null;

export class AIProxyConnector extends BaseRequester {
  constructor(
    baseUrl: string,
    private readonly serviceHeader: string,
    traceId?: string
  ) {
    if (aiProxyConnectorInstance) {
      return aiProxyConnectorInstance
    };

    super({ baseURL: baseUrl, globalTraceId: traceId });
    aiProxyConnectorInstance = this;
  }

  async filterFiles(course: string, files: Files[]) {
    const headers = new Headers();
    headers.set('x-service-id', this.serviceHeader);
    const response = await this.request<unknown[]>('/', {
      method: 'POST',
      body: {
        course,
        promptData: {
          course,
          promptData: files.map((file) => ({
            pdfLink: file.url,
            pdfName: file.name,
          })),
        },
      },
    });
    return response;
  }
}
