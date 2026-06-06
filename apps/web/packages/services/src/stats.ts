import type {
  CourseName,
  PageableReturn,
  StatsClass,
  StatsCourse,
  StatsOverview,
  StatsSubject,
  StatsUsage,
} from './types';

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
  getAllClasses: async (params: StatsParams) => {
    const { data } = await api.get('public/stats/components', { params });
    return data as PageableReturn<StatsClass>;
  },
  getAllCourses: async (params: StatsParams) => {
    const { data } = await api.get('public/stats/components/courses', { params });
    return data as PageableReturn<StatsCourse>;
  },
  getAllSubjects: async (params: StatsParams) => {
    const { data } = await api.get('public/stats/components/component', { params });
    return data as PageableReturn<StatsSubject>;
  },
  getAllCoursesNames: async () => {
    const { data } = await api.get('/histories/courses');
    return data as CourseName[];
  },
  getOverview: async (params: Pick<StatsParams, 'season'>) => {
    const { data } = await api.get('public/stats/components/overview', { params });
    return data as StatsOverview;
  },
  getUsage: async (params: Pick<StatsParams, 'season'>) => {
    const { data } = await api.get('public/stats/usage', { params });
    return data as StatsUsage;
  },
};
