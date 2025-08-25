import { SearchComponentItem } from '@ufabc-next/types';

import { api } from './api';

export const Whatsapp = {
  searchComponents: async (q: string) =>
    api.get<SearchComponentItem[]>('entities/components', {
      params: { q },
    }),
  getComponentsByUser: async () => api.get<any>('entities/enrollments/wpp'),
};
