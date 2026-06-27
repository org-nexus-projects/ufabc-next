import { BaseRequester } from './base-requester.ts';

type SendAnnouncementParams = {
  courseIdentifier: number;
  season: string;
  message: string;
};

type SendAnnouncementResponse = {
  message: string;
};

let communicationsConnectorInstance: CommunicationsConnector | null = null;

export class CommunicationsConnector extends BaseRequester {
  constructor(baseURL: string, traceId?: string) {
    if (communicationsConnectorInstance) {
      return communicationsConnectorInstance;
    };

    super({ baseURL, globalTraceId: traceId });
    communicationsConnectorInstance = this;
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
