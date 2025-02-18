import type {
  CourseName,
  PageableReturn,
  StatsClass,
  StatsCourse,
  StatsOverview,
  StatsSubject,
  StatsUsage,
} from 'types';

import { api } from './api';

export type StatsParams = {
  page: number;
  deficit?: 1;
  vagas?: 1;
  ratio?: 1;
  requisicoes?: 1;
  turno?: 'diurno' | 'noturno';
  season: string;
};

export const StatsSubjects = {
  getAllClasses: (params: StatsParams) =>
    api.get<PageableReturn<StatsClass>>('public/stats/components', { params }),
  getAllCourses: (params: StatsParams) =>
    api.get<PageableReturn<StatsCourse>>('public/stats/components/courses', {
      params,
    }),
  getAllSubjects: (params: StatsParams) =>
    api.get<PageableReturn<StatsSubject>>('public/stats/components/component', {
      params,
    }),
  getAllCoursesNames: () => api.get<CourseName[]>('/histories/courses'),
  getOverview: (params: Pick<StatsParams, 'season'>) =>
    api.get<StatsOverview>('public/stats/components/overview', { params }),
  getUsage: (params: Pick<StatsParams, 'season'>) =>
    api.get<StatsUsage>('public/stats/usage', { params }),
};
