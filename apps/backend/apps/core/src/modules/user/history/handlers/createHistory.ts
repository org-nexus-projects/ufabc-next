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

import { type Subject, SubjectModel } from '@/models/Subject.js';

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

  let history = await HistoryModel.findOne({
    ra: studentHistory.ra,
  }).lean<History>();

  const course = transformCourseName(
    studentHistory.course,
    studentHistory.courseKind,
  ) as string;
  const allUFCourses = await ufProcessor.getCourses();
  const studentCourse = allUFCourses.find(
    (UFCourse) => UFCourse.name === course.toLocaleLowerCase(),
  );

  if (!studentCourse) {
    return reply.notFound('not found user course');
  }

  let studentGrade = '';

  if (history?.grade) {
    studentGrade = history.grade;
  } else {
    const studentCourseGrades = await ufProcessor.getCourseGrades(
      studentCourse.UFcourseId,
    );

    if (!studentCourseGrades) {
      return reply.notFound(
        'Curso não encontrado (entre em contato conosco por favor)',
      );
    }
    studentGrade = studentCourseGrades.at(0)?.year ?? '';
  }

  const UFgraduation = await ufProcessor.getGraduationComponents(
    studentCourse.UFcourseId,
    studentGrade,
  );

  const allSubjects = await SubjectModel.find({});

  const hydratedComponents = await hydrateComponents(
    studentHistory.components,
    UFgraduation.components,
    allSubjects,
  );

  if (!history && hydratedComponents.length > 0) {
    history = await HistoryModel.create({
      ra: studentHistory.ra,
      curso: course,
      disciplinas: hydratedComponents,
      coefficients: null,
      grade: studentGrade,
    });
  } else if (history) {
    history = await HistoryModel.findOneAndUpdate(
      { ra: studentHistory.ra, curso: course },
      { $set: { disciplinas: hydratedComponents } },
      { new: true },
    );
  }

  logger.warn(studentHistory);

  logger.info({
    student: studentHistory.ra,
    course: studentHistory.course,
    dbGrade: history?.grade,
    rawGrade: studentGrade,
    msg: 'Synced Successfully',
  });
  historyCache.set(cacheKey, history);

  return {
    msg: history
      ? `Updated history for ${studentHistory.ra}`
      : `Created history for ${studentHistory.ra}`,
    history,
  };
}

async function hydrateComponents(
  components: StudentComponent[],
  graduationComponents: GraduationComponents[],
  allSubjects: Subject[],
): Promise<HydratedComponent[]> {
  const hydratedComponents = [];

  for (const component of components) {
    const gradComponent = graduationComponents.find(
      (gc) => gc.name === component.disciplina,
    );

    let componentCredits = 0;
    if (!gradComponent) {
      // this will always be a free component
      logger.warn(
        { name: component.disciplina, codigo: component.codigo },
        'No matching graduation component found',
      );

      const subject = allSubjects.find(
        (subject) => subject.name.toLocaleLowerCase() === component.disciplina,
      );

      if (!subject) {
        const createdSubject = await SubjectModel.create({
          name: component.disciplina,
          creditos: 0,
        });
        componentCredits = createdSubject.creditos;
      } else {
        componentCredits = subject.creditos;
      }
    } else {
      componentCredits = gradComponent.credits;
    }

    hydratedComponents.push({
      disciplina: component.disciplina,
      creditos: componentCredits,
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
