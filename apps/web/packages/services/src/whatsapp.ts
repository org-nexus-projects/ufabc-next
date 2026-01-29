import { SearchComponentItem, SearchCourseItem } from '@ufabc-next/types';

import { api } from './api';


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
  timetable: Timetable[];
};

export const Whatsapp = {
  searchComponents: async (q: string) =>
    api.get<SearchComponentItem[]>('entities/components'),
  getComponentsByUser: async (ra: number) =>
    api.get<SearchComponentItem[]>('entities/enrollments/wpp', {
      params: { ra, season: '2026:1' },
    }),
  getCourses: async () => {
    const response = await fetch('https://ufabc-parser.com/v2/components/curriculum/subjects');
    if (!response.ok) {
      throw new Error('falha ao chamar o parser para buscar cursos');
    }
    return response.json() as Promise<SearchCourseItem[]>;
  },

  searchComponentsBySeason: async (season:string) => {
    const response = await fetch(`https://ufabc-parser.com/v2/components?season=${season}`);
    if (!response.ok) {
      throw new Error('falha ao chamar o parser para buscar cursos');
    }
    return response.json() as Promise<UfabcParserComponent[]>;
  },

};