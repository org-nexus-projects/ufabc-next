import { LRUCache } from 'lru-cache';
import { z } from 'zod';
import { HistoryModel } from '@/models/History.js';
import { SubjectModel } from '@/models/Subject.js';
import { logger } from '@next/common';
import { transformCourseName } from '../utils/transformCourseName.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

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
  disciplina: z.string().transform((name) => name.trim().toLocaleLowerCase()),
  resultado: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'O', '--']),
});

const validateSigaaHistory = z.object({
  //updateTime: z.date().optional(),
  course: z.string().transform((c) => c.toLocaleLowerCase()),
  ra: z.number(),
  courseKind: z.string().toLowerCase(),
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
    (component) => hydrateComponents(component, studentHistory.ra),
  );
  const hydratedComponents = await Promise.all(hydratedComponentsPromises);
  const course = transformCourseName(
    studentHistory.course,
    studentHistory.courseKind,
  );

  let history = await HistoryModel.findOne({
    ra: studentHistory.ra,
  });

  if (!history && hydratedComponents.length > 0) {
    history = await HistoryModel.create({
      ra: studentHistory.ra,
      curso: course,
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
      curso: course,
    },
    {
      $set: {
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

async function hydrateComponents(component: StudentComponent, ra: number) {
  const subjects = await SubjectModel.find({
    creditos: {
      $exists: true,
    },
  });
  const normalizedSubjects = subjects.map((subject) => ({
    name: subject.name.trim().toLocaleLowerCase(),
    credits: subject.creditos,
  }));
  const componentSubject = component.disciplina.trim().toLocaleLowerCase();
  const validComponent = normalizedSubjects.find(
    (subject) => subject.name === componentSubject,
  );

  if (!validComponent) {
    logger.warn({ name: componentSubject }, 'No valid component found');
    return;
  }

  const existingHistory = await HistoryModel.findOne({ ra });
  let category = null;
  if (existingHistory) {
    const existingComponents = existingHistory.disciplinas.find(
      (disciplina) => disciplina.codigo === component?.codigo || false,
    );
    category = existingComponents?.categoria ?? null;
  }

  return {
    conceito: component.resultado === '--' ? null : component.resultado,
    periodo: component.periodo,
    situacao: component.situacao === '--' ? null : component.situacao,
    ano: component.ano,
    codigo: component.codigo,
    creditos: validComponent.credits,
    disciplina: validComponent.name,
    categoria: category,
  };
}
