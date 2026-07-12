import type {
  SearchSubject,
  SearchTeacher,
  SubjectInfo,
  TeacherReview,
} from './types';

import { api } from './api';

const toTitleCase = (name: string): string =>
  name
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');

export const Reviews = {
  searchTeachers: async (q: string) => {
    const { data } = await api.get('/entities/teachers/search', {
      params: { q },
    });
    const result = data as SearchTeacher;
    return {
      ...result,
      data: result.data.map((teacher) => ({
        ...teacher,
        name: toTitleCase(teacher.name),
      })),
    };
  },
  searchSubjects: async (q: string) => {
    const { data } = await api.get('/entities/subjects/search', {
      params: { q },
    });
    const result = data as SearchSubject;
    return {
      ...result,
      data: result.data.map((subject) => ({
        ...subject,
        name: toTitleCase(subject.name),
      })),
    };
  },
  getTeacher: async (id: string) => {
    const { data } = await api.get(`/entities/teachers/reviews/${id}`);
    const result = data as TeacherReview;
    return {
      ...result,
      teacher: { ...result.teacher, name: toTitleCase(result.teacher.name) },
      specific: result.specific.map((subject) => ({
        ...subject,
        _id: { ...subject._id, name: toTitleCase(subject._id.name) },
      })),
    };
  },
  getSubject: async (id: string) => {
    const { data } = await api.get(`/entities/subjects/reviews/${id}`);
    const result = data as SubjectInfo;
    return {
      ...result,
      subject: { ...result.subject, name: toTitleCase(result.subject.name) },
      specific: result.specific.map((subject) => ({
        ...subject,
        teacher: subject.teacher
          ? { ...subject.teacher, name: toTitleCase(subject.teacher.name) }
          : subject.teacher,
      })),
    };
  },
};
