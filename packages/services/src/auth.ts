import { api } from './api';

export type WhatsAppTokenExchangeResponse = {
  token: string;
};

export const Auth = {
  getWhatsappToken: (token: string, component?: string | string[]) =>
    api.post<WhatsAppTokenExchangeResponse>('/v2/auth/whatsapp-token', {
      component,
      token,
    }),
};
