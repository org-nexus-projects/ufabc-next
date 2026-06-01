import type {
  SearchSubject,
  SearchTeacher,
  SubjectInfo,
  TeacherReview,
} from './types';

import { api } from './api';

export const Reviews = {
  searchTeachers: async (q: string) => {
    const { data } = await api.get('/entities/teachers/search', {
      params: { q },
    });
    return data as SearchTeacher;
  },
  searchSubjects: async (q: string) => {
    const { data } = await api.get('/entities/subjects/search', {
      params: { q },
    });
    return data as SearchSubject;
  },
  getTeacher: async (id: string) => {
    const { data } = await api.get(`/entities/teachers/reviews/${id}`);
    return data as TeacherReview;
  },
  getSubject: async (id: string) => {
    const { data } = await api.get(`/entities/subjects/reviews/${id}`);
    return data as SubjectInfo;
  },
};
