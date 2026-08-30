import { BaseRequester } from './base-requester.ts';

type Files = {
  url: string;
  name: string;
};

export type AIProxyConnectorOptions = {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  globalTraceId?: string;
};

export class AIProxyConnector extends BaseRequester {
  constructor(options: AIProxyConnectorOptions) {
    super({ ...options, component: 'ai-proxy' });
  }

  async filterFiles(course: string, files: Files[]) {
    const response = await this.request<unknown[]>('/', {
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
      method: 'POST',
    });
    return response;
  }
}
