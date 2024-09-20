import { LRUCache } from 'lru-cache';
import { z } from 'zod';
import {
  type Categories,
  type History,
  HistoryModel,
} from '@/models/History.js';
import { logger } from '@next/common';
import { transformCourseName } from '../utils/transformCourseName.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  ufProcessor,
  type GraduationComponents,
} from '@/services/ufprocessor.js';

const CACHE_TTL = 1000 * 60 * 60;
const historyCache = new LRUCache<string, History>({ max: 3, ttl: CACHE_TTL });

const validateSigaaComponents = z.object({
  ano: z.coerce.number(),
  periodo: z
    .enum(['1', '2', '3', 'QS'])
    .transform((p) => (p === 'QS' ? '3' : p)),
  codigo: z.string(),
  situacao: z
    .enum(['APROVADO', 'REPROVADO', 'REPROVADO POR FALTAS', '--', ''])
    .transform((situation) => situation.toLocaleLowerCase()),
  disciplina: z.string().transform((name) => name.trim().toLocaleLowerCase()),
  resultado: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'O', '--', '']),
});

const validateSigaaHistory = z.object({
  course: z.string().transform((c) => c.toLocaleLowerCase()),
  ra: z.number(),
  courseKind: z.string().toLowerCase(),
  components: validateSigaaComponents.array(),
});

type StudentComponent = z.infer<typeof validateSigaaComponents>;
type HydratedComponent = {
  disciplina: string;
  conceito: StudentComponent['resultado'] | null;
  periodo: StudentComponent['periodo'];
  codigo: StudentComponent['codigo'];
  ano: number;
  situacao: string | null;
  categoria: Categories;
  creditos: number;
};

export async function createHistory(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const studentHistory = validateSigaaHistory.parse(request.body);

  if (!studentHistory.ra) {
    return reply.badRequest('Missing user RA');
  }

  const cacheKey = `history:${studentHistory.ra}`;
  const cached = historyCache.get(cacheKey);

  if (cached) {
    return {
      msg: 'Cached history!',
      cached,
    };
  }

  const course = transformCourseName(
    studentHistory.course,
    studentHistory.courseKind,
  );
  const UFgraduation = await ufProcessor.getGraduationComponents(73710, '2017');
  const hydratedComponents = hydrateComponents(
    studentHistory.components,
    UFgraduation.components,
  );
  let history = await HistoryModel.findOne({
    ra: studentHistory.ra,
  }).lean<History>();

  if (!history && hydratedComponents.length > 0) {
    history = await HistoryModel.create({
      ra: studentHistory.ra,
      curso: course,
      disciplinas: hydratedComponents,
      coefficients: null,
      grade: null,
    });
  } else if (history) {
    history = await HistoryModel.findOneAndUpdate(
      { ra: studentHistory.ra, curso: course },
      { $set: { disciplinas: hydratedComponents } },
      { new: true },
    );
  }

  historyCache.set(cacheKey, history);

  return {
    msg: history
      ? `Updated history for ${studentHistory.ra}`
      : `Created history for ${studentHistory.ra}`,
    history,
  };
}

function hydrateComponents(
  components: StudentComponent[],
  graduationComponents: GraduationComponents[],
): HydratedComponent[] {
  const hydratedComponents = [];
  for (const component of components) {
    const gradComponent = graduationComponents.find(
      (gc) => gc.UFComponentCode === component.codigo,
    );

    if (!gradComponent) {
      // this will always be a free component
      logger.warn(
        { name: component.disciplina, codigo: component.codigo },
        'No matching graduation component found',
      );
    }

    hydratedComponents.push({
      disciplina: component.disciplina,
      creditos: gradComponent?.credits || 0,
      conceito:
        component.resultado === '--' || component.resultado === ''
          ? null
          : component.resultado,
      periodo: component.periodo,
      situacao:
        component.situacao === '--' || component.situacao === ''
          ? null
          : component.situacao,
      ano: component.ano,
      codigo: component.codigo,
      categoria: resolveCategory(gradComponent?.category),
    });
  }

  return hydratedComponents;
}

const resolveCategory = (
  category?: GraduationComponents['category'],
): Categories => {
  switch (category) {
    case 'limited':
      return 'Opção Limitada';
    case 'mandatory':
      return 'Obrigatória';
    default:
      return 'Livre Escolha';
  }
};
