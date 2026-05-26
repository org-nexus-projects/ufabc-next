import { BaseRequester } from './base-requester.js';

type SendAnnouncementInput = {
  courseIdentifier: number;
  season: string;
  text: string;
};

type SendAnnouncementResponse = {
  message: string;
};

export class CommunicationsConnector extends BaseRequester {
  constructor(baseURL: string, globalTraceId?: string) {
    super(baseURL, globalTraceId);
  }

  async sendAnnouncement(
    input: SendAnnouncementInput
  ): Promise<SendAnnouncementResponse> {
    const { courseIdentifier, season, text } = input;

    return this.request<SendAnnouncementResponse>('/groups/announcements', {
      method: 'POST',
      body: {
        courseIdentifier,
        season,
        message: text,
      },
    });
  }
}
