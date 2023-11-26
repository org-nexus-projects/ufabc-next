import {
  SearchSubject,
  SearchTeacher,
  SubjectInfo,
  TeacherReview,
} from 'types';

import { api } from './api';

export const Reviews = {
  searchTeachers: async (q: string) =>
    api.get<SearchTeacher>('/teachers/search', {
      params: { q },
    }),
  searchSubjects: async (q: string) =>
    api.get<SearchSubject>('/subjects/search', {
      params: { q },
    }),
  getTeacher: async (id: string) =>
    api.get<TeacherReview>(`/reviews/teachers/${id}`),
  getSubject: async (id: string) =>
    api.get<SubjectInfo>(`/reviews/subjects/${id}`),
};
