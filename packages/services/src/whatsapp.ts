import { api, apiParser } from './api';
import type { SearchComponentItem, SearchCourseItem } from './types';

export type UfabcParserComponent = {
  componentKey: string;
  subjectKey: string;
  name: string;
  credits: number;
  ufComponentId: number;
  ufComponentCode: string;
  campus: 'sbc' | 'sa';
  shift: 'morning' | 'night';
  vacancies: number;
  componentClass: string;
  season: string;
  ufClassroomCode: string;
  tpi: {
    theory: number;
    practice: number;
    individual: number;
  };
  courses: Array<{
    name: string;
    UFCourseId: number;
    category: 'limited' | 'mandatory';
  }>;
  teachers: Array<{
    name: string;
    role: 'professor' | 'practice';
    isSecondary: boolean;
  }>;
  // timetable: Timetable[]; // Removed for now
};

export const Whatsapp = {
  getComponentsByUser: async ({
    ra,
    season,
  }: {
    ra: number;
    season: string;
  }) => {
    const { data } = await api.get<SearchComponentItem[]>(
      'entities/enrollments/wpp',
      {
        params: { ra, season },
      }
    );
    return data;
  },
  getCourses: async () => {
    const response = await apiParser.get<SearchCourseItem[]>(
      '/components/curriculum/subjects'
    );
    return response.data;
  },
  searchComponents: async (season: string) => {
    const { data } = await api.get<SearchComponentItem[]>('v2/components', {
      params: { season },
    });
    return data;
  },
  searchComponentsBySeason: async (season: string) => {
    const response = await apiParser.get<UfabcParserComponent[]>(
      '/components',
      {
        params: { season },
      }
    );
    return response.data;
  },
};
