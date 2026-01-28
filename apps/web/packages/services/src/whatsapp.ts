import { SearchComponentItem, SearchCourseItem } from '@ufabc-next/types';

import { api } from './api';

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
};