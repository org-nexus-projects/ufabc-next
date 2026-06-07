import { BaseRequester, type TraceProvider } from './base-requester.js';

type SendAnnouncementParams = {
  courseIdentifier: number;
  season: string;
  message: string;
};

type SendAnnouncementResponse = {
  message: string;
};

export class CommunicationsConnector extends BaseRequester {
  constructor(baseURL: string, traceProvider?: TraceProvider) {
    super(baseURL, traceProvider);
  }

  async sendAnnouncement(
    params: SendAnnouncementParams
  ) {
    const { courseIdentifier, season, message } = params;

    return this.request<SendAnnouncementResponse>('/groups/announcements', {
      method: 'POST',
      body: {
        courseIdentifier,
        season,
        message,
      },
    });
  }
}
