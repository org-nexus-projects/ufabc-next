import { BaseRequester } from './base-requester.js';

type Files = {
  url: string;
  name: string;
};

export class AIProxyConnector extends BaseRequester {
  constructor() {
    super(process.env.NEXT_AI_LAMBDA_URL);
  }

  async filterFiles(course: string, files: Files[]) {
    const headers = new Headers();
    headers.set('x-service-id', process.env.SERVICE_HEADER ?? '');
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
