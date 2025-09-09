import { SearchComponentItem } from '@ufabc-next/types';

import { api } from './api';

export const Whatsapp = {
  searchComponents: async (q: string) =>
    api.get<SearchComponentItem[]>('entities/components'),
  getComponentsByUser: async (ra: number) =>
    api.get<SearchComponentItem[]>('entities/enrollments/wpp', {
      params: { ra, season: '2025:2' },
    }),
};
