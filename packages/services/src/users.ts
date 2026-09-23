import type { User } from './types';

import { api } from './api';

export type UserSignup = {
  email: string;
  ra: number;
};

export type FacebookAuth = {
  // user personal email `not` @aluno.ufabc.edu.br
  email: string;
  ra: string;
};

export type FacebookConfirmResponse = {
  token: string;
};

export type UserConfirmResponse = {
  token: string;
};

export type EmailResponse = {
  email: string;
};

export const Users = {
  completeSignup: async (params: UserSignup) => {
    const { data } = await api.put('/v2/users/complete', params);
    return data as UserConfirmResponse;
  },
  confirmSignup: async (token: string) => {
    const { data } = await api.post('/v2/users/confirm', { token });
    return data as UserConfirmResponse;
  },
  resendEmail: () => api.post('/v2/users/resend'),
  recovery: (email: string) => api.post('/v2/users/recover', { email }),
  delete: () => api.delete('/v2/users/remove'),
  info: async () => {
    const { data } = await api.get('/v2/users/info');
    return data as User;
  },
  facebookAuth: async (params: FacebookAuth) => {
    const { data } = await api.post('/v2/users/facebook', params);
    return data as FacebookConfirmResponse;
  },
  getEmail: async (ra: string) => {
    const { data } = await api.get('/v2/users/check-email', { params: { ra } });
    return data as EmailResponse;
  },
};
