import type { SearchComponentItem, SearchCourseItem } from './types';

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
  searchComponents: async (season: string) => {
    const { data } = await api.get('v2/components', {
      params: { season },
    });
    return data as SearchComponentItem[];
  },
  getComponentsByUser: async ({ ra, season }: { ra: number; season: string }) => {
    const { data } = await api.get('entities/enrollments/wpp', {
      params: { ra, season },
    });
    return data as SearchComponentItem[];
  },
  getCourses: async () => {
    const response = await apiParser.get('/components/curriculum/subjects');
    return response.data as SearchCourseItem[];
  },

  searchComponentsBySeason: async (season: string) => {
    const response = await apiParser.get<UfabcParserComponent[]>('/components', {
      params: { season },
    });
    return response.data;
  },
};
