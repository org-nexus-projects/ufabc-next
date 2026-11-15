import { api } from './api';
import type { Enrollment } from './types';

export const Enrollments = {
  get: async (id: string) => {
    const { data } = await api.get<Enrollment>(`/entities/enrollments/${id}`);
    return data;
  },
  list: async () => {
    const { data } = await api.get<Enrollment[]>('/entities/enrollments');
    return data;
  },
};
