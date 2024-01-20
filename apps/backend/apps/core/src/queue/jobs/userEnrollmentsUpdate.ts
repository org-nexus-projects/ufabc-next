import {
  type HistoryDiscipline,
  asyncParallelMap,
  calculateCoefficients,
  generateIdentifier,
  logger,
  modifyPayload,
} from '@next/common';
import { get } from 'lodash-es';
import { createQueue } from '../utils/queue.js';
import type {
  EnrollmentModel,
  GraduationDocument,
  GraduationHistoryModel,
  GraduationModel,
  History,
  SubjectDocument,
  SubjectModel,
} from '@/models/index.js';
import type { Job } from 'bullmq';

//TODO: Add cache for main teacher and subject
//TODO: fix the subject model cache
//TODO: replace _.get with a native function

type UpdateUserEnrollments = {
  doc: History;
  enrollmentModel: typeof EnrollmentModel;
  graduationModel: typeof GraduationModel;
  graduationHistoryModel: typeof GraduationHistoryModel;
  subjectModel: typeof SubjectModel;
};

export async function updateUserEnrollments({
  doc,
  enrollmentModel,
  graduationModel,
  graduationHistoryModel,
  subjectModel,
}: UpdateUserEnrollments) {
  if (!doc.disciplinas) {
    return;
  }
  const isDisciplines = Array.isArray(doc.disciplinas)
    ? doc.disciplinas
    : [doc.disciplinas];

  const disciplinesArr: HistoryDiscipline[] = isDisciplines.filter(Boolean);

  let graduation: GraduationDocument | null = null;

  if (doc.curso && doc.grade) {
    graduation = await graduationModel
      .findOne({
        curso: doc.curso,
        grade: doc.grade,
      })
      .lean(true);
  }

  const coefficients = calculateCoefficients(disciplinesArr, graduation);

  await graduationHistoryModel.findOneAndUpdate(
    {
      curso: checkAndFixCourseName(doc.curso),
      grade: doc.grade,
      ra: doc.ra,
    },
    {
      curso: checkAndFixCourseName(doc.curso),
      grade: doc.grade,
      ra: doc.ra,
      coefficients,
      disciplinas: disciplinesArr,
      graduation: graduation ? graduation._id : null,
    },
    { upsert: true },
  );

  const updateOrCreateEnrollments = async (discipline: HistoryDiscipline) => {
    const disc = {
      ra: doc.ra,
      year: discipline.ano,
      quad: discipline.periodo,
      disciplina: discipline.disciplina,
    };

    const keys = ['ra', 'year', 'quad', 'disciplina'] as const;

    const coef = getLastPeriod(
      doc.coefficients,
      discipline.ano,
      discipline.periodo,
    );

    const enrollmentPayload = {
      ra: disc.ra!,
      year: disc.year,
      quad: disc.quad,
      disciplina: disc.disciplina,
      conceito: discipline.conceito,
      creditos: discipline.creditos,
      cr_acumulado: get(coef, 'cr_acumulado'),
      ca_acumulado: get(coef, 'ca_acumulado'),
      cp_acumulado: get(coef, 'cp_acumulado'),
    };

    //for some reason the cache that is supposed to be in the subject model is not working
    const subjects: SubjectDocument[] = await subjectModel.find({}).lean(true);
    const modifiedPayload = modifyPayload(enrollmentPayload, subjects, {});

    await enrollmentModel.findOneAndUpdate(
      {
        // TODO: remove any later
        identifier:
          discipline.identifier || generateIdentifier(disc, keys as any),
      },
      modifiedPayload,
      {
        new: true,
        upsert: true,
      },

      //   if(enrollment.mainTeacher) {
      //   const cacheKey = `reviews_${enrollment.mainTeacher}`
      //   await app.redis.cache.del(cacheKey)
      // }
      //
      // if(enrollment.subject) {
      //   const cacheKey = `reviews_${enrollment.subject}`
      //   await app.redis.cache.del(cacheKey)
      // }
    );
  };
  return asyncParallelMap(disciplinesArr, updateOrCreateEnrollments, 10);
}

function checkAndFixCourseName(courseName?: string) {
  return courseName === 'Bacharelado em CIências e Humanidades'
    ? 'Bacharelado em Ciências e Humanidades'
    : courseName;
}

function getLastPeriod(
  disciplines: Record<string, unknown>,
  year: number,
  quad: number,
  begin?: string,
) {
  if (!begin) {
    const firstYear = Object.keys(disciplines)[0];
    const firstMonth = Object.keys(disciplines[firstYear]!)[0];
    begin = `${firstYear}.${firstMonth}`;
  }

  if (quad === 1) {
    quad = 3;
    year -= 1;
  } else if (quad === 2 || quad === 3) {
    quad -= 1;
  }

  if (begin > `${year}.${quad}`) {
    return null;
  }

  const resp = get(disciplines, `${year}.${quad}`, null);
  if (resp === null) {
    return getLastPeriod(disciplines, year, quad, begin);
  }

  return resp;
}

export const updaterUserEnrollmentsQueue = createQueue(
  'UserEnrollments:Update',
);

export const addUserEnrollmentsToQueue = async (
  payload: Job<UpdateUserEnrollments>,
) => {
  await updaterUserEnrollmentsQueue.add('UserEnrollments:Update', payload);
};

export const userEnrollmentsUpdateWorker = async (
  job: Job<UpdateUserEnrollments>,
) => {
  const payload = job.data;
  try {
    // TODO: pass models here
    await updateUserEnrollments(payload);
  } catch (error) {
    logger.error(
      { error },
      'updateUserEnrollmentsWorker: Error updating user enrollments',
    );
    throw error;
  }
};
