import { SearchComponentItem, SearchCourseItem } from '@ufabc-next/types';

import { api, apiParser } from './api';

export interface UfabcParserComponent {
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
    name: string | '-';
    UFCourseId: number;
    category: 'limited' | 'mandatory';
  }>;
  teachers: Array<{
    name: string;
    role: 'professor' | 'practice';
    isSecondary: boolean;
  }>;
  // timetable: Timetable[]; // Removed for now
}

export const Whatsapp = {
  searchComponents: async (q: string) =>
    api.get<SearchComponentItem[]>('entities/components'),
  getComponentsByUser: async (ra: number) =>
    api.get<SearchComponentItem[]>('entities/enrollments/wpp', {
      params: { ra, season: '2026:1' },
    }),
  getCourses: async () => {
    const response = await apiParser.get<SearchCourseItem[]>(
      '/components/curriculum/subjects',
    );
    return response.data;
  },

  searchComponentsBySeason: async (season: string) => {
    const response = await apiParser.get<UfabcParserComponent[]>(
      '/components',
      {
        params: { season },
      },
    );
    return response.data;
  },
};
