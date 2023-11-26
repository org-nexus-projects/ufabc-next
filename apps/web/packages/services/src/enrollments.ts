import { Enrollment } from 'types';

import { api } from './api';

export const Enrollments = {
  list: () => api.get<Enrollment[]>('/enrollments'),
  get: (id: string) => api.get<Enrollment>('/enrollments/' + id),
};
