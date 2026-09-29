import { api } from './api';

export type BackofficeTokenResponse = {
  token: string;
};

export const Backoffice = {
  getToken: async (email: string) => {
    const { data } = await api.post<BackofficeTokenResponse>(
      '/backoffice/token',
      { email }
    );
    return data;
  },
};
