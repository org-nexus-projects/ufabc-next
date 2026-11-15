import { api } from './api';
import type { User } from './types';

export type UserSignup = {
  email: string;
  ra: number;
};

export type UserConfirmResponse = {
  token: string;
};

export type EmailResponse = {
  email: string;
};

export const Users = {
  completeSignup: async (params: UserSignup) => {
    const { data } = await api.put<UserConfirmResponse>(
      '/users/complete',
      params
    );
    return data;
  },
  confirmSignup: async (token: string) => {
    const { data } = await api.post<UserConfirmResponse>('/users/confirm', {
      token,
    });
    return data;
  },
  delete: async () => await api.delete('/users/remove'),
  getEmail: async (ra: string) => {
    const { data } = await api.get<EmailResponse>('/users/check-email', {
      params: { ra },
    });
    return data;
  },
  info: async () => {
    const { data } = await api.get<User>('/users/info');
    return data;
  },
  recovery: async (email: string) =>
    await api.post('/users/recover', { email }),
  resendEmail: async () => await api.post('/users/resend'),
};
