import { api } from './api';

export type WhatsAppTokenExchangeResponse = {
  token: string;
};

export const Auth = {
  getWhatsappToken: async (token: string, component?: string | string[]) => {
    const { data } = await api.post<WhatsAppTokenExchangeResponse>('/v2/auth/whatsapp-token', {
      component,
      token,
    });
    return data;
  },
};
