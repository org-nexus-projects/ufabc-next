import { api } from './api';
import type {
  CourseName,
  PageableReturn,
  StatsClass,
  StatsCourse,
  StatsOverview,
  StatsSubject,
  StatsUsage,
} from './types';

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
    const { data } = await api.get<PageableReturn<StatsClass>>(
      'public/stats/components',
      { params }
    );
    return data;
  },
  getAllCourses: async (params: StatsParams) => {
    const { data } = await api.get<PageableReturn<StatsCourse>>(
      'public/stats/components/courses',
      { params }
    );
    return data;
  },
  getAllCoursesNames: async () => {
    const { data } = await api.get<CourseName[]>('/histories/courses');
    return data;
  },
  getAllSubjects: async (params: StatsParams) => {
    const { data } = await api.get<PageableReturn<StatsSubject>>(
      'public/stats/components/component',
      { params }
    );
    return data;
  },
  getOverview: async (params: Pick<StatsParams, 'season'>) => {
    const { data } = await api.get<StatsOverview>(
      'public/stats/components/overview',
      { params }
    );
    return data;
  },
  getUsage: async (params: Pick<StatsParams, 'season'>) => {
    const { data } = await api.get<StatsUsage>('public/stats/usage', {
      params,
    });
    return data;
  },
};
