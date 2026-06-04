import {
  SearchSubject,
  SearchTeacher,
  SubjectInfo,
  TeacherReview,
} from '@ufabc-next/types';

import { api } from './api';

export const Reviews = {
  searchTeachers: async (q: string) =>
    api.get<SearchTeacher>('/entities/teachers/search', {
      params: { q },
    }),
  searchSubjects: async (q: string) =>
    api.get<SearchSubject>('/entities/subjects/search', {
      params: { q },
    }),
  getTeacher: async (id: string) =>
    api.get<TeacherReview>(`/entities/teachers/reviews/${id}`),
  getSubject: async (id: string) =>
    api.get<SubjectInfo>(`/entities/subjects/reviews/${id}`),
};
