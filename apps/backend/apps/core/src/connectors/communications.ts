import { BaseRequester } from './base-requester.js';

type SendAnnouncementParams = {
  courseIdentifier: number;
  season: string;
  message: string;
};

type SendAnnouncementResponse = {
  message: string;
};

export class CommunicationsConnector extends BaseRequester {
  constructor(baseURL: string, globalTraceId?: string) {
    super(baseURL, globalTraceId);
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
