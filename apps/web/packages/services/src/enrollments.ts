import { Enrollment } from 'types';

import { api } from './api';

export const Enrollments = {
  list: () => api.get<Enrollment[]>('/entities/enrollments'),
  get: (id: string) => api.get<Enrollment>(`/entities/enrollments/${id}`),
};
