import type { Enrollment } from './types';

import { api } from './api';

export const Enrollments = {
  list: async () => {
    const { data } = await api.get('/entities/enrollments');
    return data as Enrollment[];
  },
  get: async (id: string) => {
    const { data } = await api.get(`/entities/enrollments/${id}`);
    return data as Enrollment;
  },
};
