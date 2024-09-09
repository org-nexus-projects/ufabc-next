import { ComponentModel } from '@/models/Component.js';
import { currentQuad } from '@next/common';
import { LRUCache } from 'lru-cache';

type ListedComponent = {
  teoria: string | undefined;
  pratica: string | undefined;
  subject: string | undefined;
  disciplina_id: number;
  turno: 'diurno' | 'noturno';
  turma: string;
  ideal_quad: boolean;
  identifier: string;
  vagas: number;
  requisicoes: number;
};

type PopulatedComponent = {
  disciplina_id: number;
  turno: 'diurno' | 'noturno';
  turma: string;
  ideal_quad: boolean;
  identifier: string;
  subject?: {
    name: string;
    search: string;
    _id: string;
  };
  vagas: number;
  alunos_matriculados: number[];
  teoria?: {
    name: string;
    _id: string;
  };
  pratica?: {
    name: string;
    _id: string;
  };
  id: string;
};

const CACHE_TTL = 1000 * 60 * 60;
const cache = new LRUCache<string, ListedComponent[]>({
  max: 2_000,
  ttl: CACHE_TTL,
});

export async function listComponents() {
  const tenant = currentQuad();
  const cacheKey = `list:components:${tenant}`;
  const cachedResponse = cache.get(cacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }

  const queryProjection = {
    disciplina_id: 1,
    turno: 1,
    turma: 1,
    ideal_quad: 1,
    identifier: 1,
    subject: 1,
    vagas: 1,
    teoria: 1,
    pratica: 1,
    alunos_matriculados: 1,
    _id: 0,
  };

  const components: PopulatedComponent[] = await ComponentModel.find(
    {
      season: tenant,
    },
    queryProjection,
  )
    .populate(['pratica', 'teoria', 'subject'])
    .lean();

  const toShow = components.map<ListedComponent>(
    ({ id: _ignore, ...component }) => ({
      ...component,
      requisicoes: component.alunos_matriculados.length ?? [],
      teoria: component.teoria?.name,
      pratica: component.pratica?.name,
      subject: component.subject?.name,
    }),
  );

  cache.set(cacheKey, toShow);

  return toShow;
}
