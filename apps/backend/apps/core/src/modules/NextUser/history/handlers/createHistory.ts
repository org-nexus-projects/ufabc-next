import { LRUCache } from 'lru-cache';
import { z } from 'zod';
import { HistoryModel } from '@/models/History.js';
import { SubjectModel } from '@/models/Subject.js';
import { logger } from '@next/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { transformCourseName } from '../utils/transformCourseName.js';

const CACHE_TTL = 1000 * 60 * 60;
const cache = new LRUCache<string, any>({
  max: 3,
  ttl: CACHE_TTL,
});

const validateSigaaComponents = z.object({
  ano: z.coerce.number(),
  periodo: z.string(),
  codigo: z.string(),
  situacao: z
    .enum(['APROVADO', 'REPROVADO', 'REPROVADO POR FALTAS', '--'])
    .transform((situation) => situation.toLocaleLowerCase()),
  disciplina: z.string().transform((name) => name.toLocaleLowerCase()),
  resultado: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'O', '--']),
});

const validateSigaaHistory = z.object({
  updateTime: z.date().optional(),
  curso: z.string().transform((c) => transformCourseName(c)),
  ra: z.number(),
  components: validateSigaaComponents.array(),
});

type StudentComponent = z.infer<typeof validateSigaaComponents>;

export async function createHistory(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const studentHistory = validateSigaaHistory.parse(request.body);

  if (!studentHistory.ra) {
    return reply.badRequest('Missing user RA');
  }

  const cacheKey = `history:${studentHistory.ra}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return {
      msg: 'Retrieved from cache',
      history: cached,
    };
  }

  const hydratedComponentsPromises = studentHistory.components.map(
    (component) => hydrateComponents(component),
  );
  const hydratedComponents = await Promise.all(hydratedComponentsPromises);

  let history = await HistoryModel.findOne({
    ra: studentHistory.ra,
  });

  if (!history) {
    history = await HistoryModel.create({
      ra: studentHistory.ra,
      curso: studentHistory.curso,
      disciplinas: hydratedComponents,
      coefficients: null,
      grade: null,
    });
    cache.set(cacheKey, history);
    return {
      msg: `Created history for ${studentHistory.ra}`,
      history,
    };
  }

  history = await HistoryModel.findOneAndUpdate(
    {
      ra: studentHistory.ra,
    },
    {
      $set: {
        curso: studentHistory.curso,
        disciplinas: hydratedComponents,
      },
    },
    {
      new: true,
    },
  );

  cache.set(cacheKey, history);

  return {
    msg: `Updated history for ${studentHistory.ra}`,
    history,
  };
}

async function hydrateComponents(component: StudentComponent) {
  const subjects = await SubjectModel.find({
    creditos: {
      $exists: true,
    },
  });
  const normalizedSubjects = subjects.map((subject) => ({
    name: subject.name.toLocaleLowerCase(),
    credits: subject.creditos,
  }));
  const validComponent = normalizedSubjects.find((subject) =>
    subject.name.includes(component.disciplina),
  );

  if (!validComponent) {
    logger.warn('No valid component found', { component });
    return;
  }

  return {
    conceito: component.resultado === '--' ? null : component.resultado,
    periodo: component.periodo,
    situacao: component.situacao === '--' ? null : component.situacao,
    ano: component.ano,
    codigo: component.codigo,
    credito: validComponent.credits,
    disciplina: validComponent.name,
  };
}
