import type { User } from 'types';

import { api } from './api';

export type UserSignup = {
  email: string;
  ra: number;
};

export type UserConfirmResponse = {
  token: string;
};

export const Users = {
  completeSignup: (params: UserSignup) => api.put('/users/complete', params),
  confirmSignup: (token: string) =>
    api.post<UserConfirmResponse>('/account/confirm', { token }),
  resendEmail: () => api.post('/users/me/resend'),
  recovery: (email: string) => api.post('/users/me/recover', { email }),
  delete: () => api.delete('/users/me/delete'),
  info: () => api.get<User>('/users/info'),
};
