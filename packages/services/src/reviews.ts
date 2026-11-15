import { api } from './api';
import type {
  SearchSubject,
  SearchTeacher,
  SubjectInfo,
  TeacherReview,
  TeacherSummary,
} from './types';

export const Reviews = {
  getSubject: async (id: string) => {
    const { data } = await api.get<SubjectInfo>(
      `/entities/subjects/reviews/${id}`
    );
    return data;
  },
  getTeacher: async (id: string) => {
    const { data } = await api.get<TeacherReview>(
      `/entities/teachers/reviews/${id}`
    );
    return data;
  },
  getTeacherSummary: async (id: string) => {
    const { data } = await api.get<TeacherSummary>(
      `/v2/teachers/${id}/summary`
    );
    return data;
  },
  searchSubjects: async (q: string) => {
    const { data } = await api.get<SearchSubject>('/entities/subjects/search', {
      params: { q },
    });
    return data;
  },
  searchTeachers: async (q: string) => {
    const { data } = await api.get<SearchTeacher>('/entities/teachers/search', {
      params: { q },
    });
    return data;
  },
};
