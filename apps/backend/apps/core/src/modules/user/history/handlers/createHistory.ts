import { LRUCache } from 'lru-cache';
import { z } from 'zod';
import {
  type History,
  type HistoryDocument,
  HistoryModel,
} from '@/models/History.js';
import { type Subject, SubjectModel } from '@/models/Subject.js';
import { logger } from '@next/common';
import { transformCourseName } from '../utils/transformCourseName.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ufProcessor } from '@/services/ufprocessor.js';

const CACHE_TTL = 1000 * 60 * 60;
const historyCache = new LRUCache<string, History>({ max: 3, ttl: CACHE_TTL });
const subjectCache = new LRUCache<string, HistorySubjects[]>({
  max: 10,
  ttl: CACHE_TTL,
});

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
type HistorySubjects = {
  name: string;
  credits: number;
  category: 'limited' | 'mandatory' | 'free';
};

type HydratedComponent = {
  disciplina: string;
  conceito: StudentComponent['resultado'] | null;
  periodo: StudentComponent['periodo'];
  codigo: StudentComponent['codigo'];
  ano: number;
  situacao: string | null;
  categoria: HistorySubjects['category'];
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
    };
  }

  const normalizedSubjects = await getNormalizedSubjects(73710, '2017');
  const course = transformCourseName(
    studentHistory.course,
    studentHistory.courseKind,
  );

  let history = await HistoryModel.findOne({
    ra: studentHistory.ra,
  }).lean<History>();
  const hydratedComponents = await hydrateComponents(
    studentHistory.ra,
    studentHistory.components,
    // biome-ignore lint/style/noNonNullAssertion:
    normalizedSubjects!,
    // biome-ignore lint/style/noNonNullAssertion:
    history!,
  );

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
      {
        $set: {
          disciplinas: hydratedComponents,
        },
      },
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

async function getCategoryFromHistory(
  subject: HistorySubjects,
  component: StudentComponent,
  existingHistory: HistoryDocument,
) {
  if (existingHistory) {
    const existingComponent = existingHistory.disciplinas.find(
      (disciplina) => disciplina.codigo === component.codigo,
    );
    if (existingComponent?.categoria) {
      return existingComponent.categoria;
    }
  }
  return transformCategory(subject.category) || 'free';
}

async function hydrateComponents(
  ra: number,
  components: StudentComponent[],
  normalizedSubjects: HistorySubjects[],
  existingHistory: HistoryDocument,
): Promise<HydratedComponent[]> {
  const subjectMap = new Map(
    normalizedSubjects.map((subject) => [subject.name, subject]),
  );
  const hydratedComponents: HydratedComponent[] = [];

  for (const component of components) {
    const componentSubject = component.disciplina.trim().toLowerCase();
    const validSubject = subjectMap.get(componentSubject);

    if (!validSubject) {
      logger.warn({ name: componentSubject, ra }, 'No valid component found');
      await SubjectModel.create({
        name: componentSubject,
        creditos: 0,
      });

      hydratedComponents.push({
        disciplina: componentSubject,
        creditos: 0,
        conceito: component.resultado,
        periodo: component.periodo,
        situacao: component.situacao,
        ano: component.ano,
        codigo: component.codigo,
        categoria: 'free',
      });
      continue;
    }

    const categoria = await getCategoryFromHistory(
      validSubject,
      component,
      existingHistory,
    );
    hydratedComponents.push({
      conceito: component.resultado === '--' || '' ? null : component.resultado,
      periodo: component.periodo,
      situacao: component.situacao === '--' || '' ? null : component.situacao,
      ano: component.ano,
      codigo: component.codigo,
      creditos: validSubject.credits,
      disciplina: validSubject.name,
      categoria,
    });
  }

  return hydratedComponents;
}

const getNormalizedSubjects = async (courseId: number, grade: string) => {
  const cacheKey = `${courseId}:${grade}`;
  const cachedSubjects = subjectCache.get(cacheKey);
  if (cachedSubjects) {
    return cachedSubjects;
  }

  const [subjects, graduationComponents] = await Promise.all([
    SubjectModel.find({ creditos: { $exists: true } }).lean<Subject[]>(),
    ufProcessor.getGraduationComponents(courseId, grade),
  ]);

  const normalizedSubjects = subjects.map((subject) => ({
    name: subject.name.trim().toLowerCase(),
    credits: subject.creditos,
    category:
      graduationComponents.components.find(
        (o) => o.name === subject.name.trim().toLowerCase(),
      )?.category || 'Livre Escolha',
  }));

  subjectCache.set(cacheKey, normalizedSubjects);
  return normalizedSubjects;
};

const transformCategory = (category: 'mandatory' | 'limited') =>
  category === 'mandatory' ? 'Obrigatória' : 'Opção Limitada';
