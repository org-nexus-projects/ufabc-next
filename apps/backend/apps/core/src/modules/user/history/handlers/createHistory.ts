import { LRUCache } from 'lru-cache';
import { z } from 'zod';
import {
  type Categories,
  type History,
  HistoryModel,
  type Situations,
} from '@/models/History.js';
import { generateIdentifier, logger } from '@next/common';
import { transformCourseName } from '../utils/transformCourseName.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  ufProcessor,
  type GraduationComponents,
} from '@/services/ufprocessor.js';

import { type Subject, SubjectModel } from '@/models/Subject.js';
import { EnrollmentModel } from '@/models/Enrollment.js';

const CACHE_TTL = 1000 * 60 * 60;
const historyCache = new LRUCache<string, History>({ max: 3, ttl: CACHE_TTL });

const validateSigaaComponents = z.object({
  ano: z.coerce.number(),
  periodo: z
    .enum(['1', '2', '3', 'QS'])
    .transform((p) => (p === 'QS' ? '3' : p)),
  codigo: z.string(),
  situacao: z
    .enum([
      'APROVADO',
      'REPROVADO',
      'REPROVADO POR FALTAS',
      '--',
      '',
      'CANCELADO',
    ])
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

  // if (cached) {
  //   return {
  //     msg: 'Cached history!',
  //     cached,
  //   };
  // }

  let history = await HistoryModel.findOne({
    ra: studentHistory.ra,
  }).lean<History>();

  logger.info({
    msg: 'starting student sync',
    student: studentHistory.ra,
    preParseCourse: studentHistory.course,
  });
  const course = transformCourseName(
    studentHistory.course,
    studentHistory.courseKind,
  ) as string;
  const allUFCourses = await ufProcessor.getCourses();
  const studentCourse = allUFCourses.find(
    (UFCourse) =>
      UFCourse.name.toLocaleLowerCase() === course.toLocaleLowerCase(),
  );

  if (!studentCourse) {
    return reply.notFound('not found user course');
  }

  let studentGrade = '';

  if (history?.grade) {
    studentGrade = history.grade;
  } else {
    const studentCourseGrades = await ufProcessor.getCourseGrades(
      studentCourse.UFCourseId,
    );

    if (!studentCourseGrades) {
      return reply.notFound(
        'Curso não encontrado (entre em contato conosco por favor)',
      );
    }
    studentGrade = studentCourseGrades.at(0)?.year ?? '';
  }

  const UFgraduation = await ufProcessor.getGraduationComponents(
    studentCourse.UFCourseId,
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
      { $set: { disciplinas: hydratedComponents, grade: studentGrade } },
      { new: true },
    );
  }

  if (history) {
    await updateEnrollments(
      studentHistory.ra,
      hydratedComponents,
      history.coefficients,
    );
  }

  logger.info({
    student: studentHistory.ra,
    dbGrade: history?.grade,
    rawGrade: studentGrade,
    studentHistory,
    msg: 'Synced Successfully',
  });

  historyCache.set(cacheKey, history!);

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
      situacao: resolveSituacao(component.situacao),
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

const resolveSituacao = (
  situacao: StudentComponent['situacao'],
): Situations | null => {
  if (situacao === '--' || situacao === '') {
    return null;
  }
  if (situacao === 'cancelado') {
    return 'Trt. Total';
  }

  // @ts-ignore the case is normalized onRequest
  return situacao;
};

async function updateEnrollments(
  ra: number,
  components: HydratedComponent[],
  coefficients: any,
) {
  for (const component of components) {
    const identifier = generateIdentifier({
      ra,
      year: component.ano,
      quad: component.periodo,
      disciplina: component.disciplina,
    });

    const periodCoeff = coefficients?.[component.ano]?.[component.periodo];
    const enrollmentData = {
      identifier,
      ra,
      year: component.ano,
      quad: component.periodo,
      disciplina: component.disciplina,
      codigo: component.codigo,
      conceito: component.conceito,
      creditos: component.creditos,
      categoria: component.categoria,
      situacao: component.situacao,
      cr_acumulado: periodCoeff?.cr_acumulado,
      ca_acumulado: periodCoeff?.ca_acumulado,
      cp_acumulado: periodCoeff?.cp_acumulado,
    };

    try {
      await EnrollmentModel.findOneAndUpdate(
        {
          ra,
          year: component.ano,
          quad: component.periodo,
          disciplina: {
            $regex: new RegExp(`^${component.disciplina.toLowerCase()}`, 'i'),
          },
        },
        enrollmentData,
        {
          new: true,
        },
      );
      logger.info({
        msg: 'Updated enrollment',
        identifier,
        ra,
        disciplina: component.disciplina,
      });
    } catch (error) {
      logger.error({
        msg: 'Failed to update enrollment',
        error,
        identifier,
        ra,
        disciplina: component.disciplina,
      });
    }
  }
}
