import {
  calculateCoefficients,
  generateIdentifier,
  logger,
  modifyPayload,
} from '@next/common';
import { get } from 'lodash-es';
import {
  type Coefficient,
  EnrollmentModel,
  type GraduationDocument,
  GraduationHistoryModel,
  GraduationModel,
  type History,
  SubjectModel,
} from '@/models/index.js';
import { createQueue } from '../utils/queue.js';
import { batchInsertItems } from '../utils/batch-insert.js';
import type { Job } from 'bullmq';

//TODO: Add cache for main teacher and subject
//TODO: fix the subject model cache
//TODO: replace _.get with a native function

export async function updateUserEnrollments(history: History) {
  if (!history.disciplinas) {
    return;
  }

  const isDisciplines = Array.isArray(history.disciplinas)
    ? history.disciplinas
    : [history.disciplinas];

  const disciplinesArr = isDisciplines.filter(Boolean);
  logger.warn({ msg: 'Disciplines arr debug', disciplinesArr });

  let graduation: GraduationDocument | null = null;
  if (history.curso && history.grade) {
    graduation = await GraduationModel.findOne({
      curso: history.curso,
      grade: history.grade,
    }).lean(true);
  }

  // @ts-expect-error I hate mongoose
  const coefficients: any = calculateCoefficients(disciplinesArr, graduation);
  history.coefficients = coefficients;

  await GraduationHistoryModel.findOneAndUpdate(
    {
      curso: checkAndFixCourseName(history.curso!),
      grade: history.grade,
      ra: history.ra,
    },
    {
      curso: checkAndFixCourseName(history.curso!),
      grade: history.grade,
      ra: history.ra,
      coefficients,
      disciplinas: disciplinesArr,
      graduation: graduation ? graduation._id : null,
    },
    { upsert: true },
  );

  const keys = ['ra', 'year', 'quad', 'disciplina'] as const;

  const updateOrCreateEnrollments = async (
    discipline: History['disciplinas'][number],
  ) => {
    const disc = {
      ra: history.ra,
      year: discipline.ano,
      quad: Number.parseInt(discipline.periodo!),
      disciplina: discipline.disciplina,
    };

    // calculate identifier for this discipline
    discipline.identifier =
      discipline.identifier || generateIdentifier(disc, keys as any);

    // find coef for this period
    const coef = getLastPeriod(
      history.coefficients!,
      discipline.ano!,
      Number.parseInt(discipline.periodo!),
    );

    logger.warn({ msg: 'Job update debug', coef });

    //for some reason the cache that is supposed to be in the subject model is not working
    // the cache key is not native its from a lib
    const subjects = await SubjectModel.find({}).lean(true);

    // create enrollment payload
    const enrollmentPayload = {
      ra: disc.ra!,
      year: disc.year!,
      quad: disc.quad,
      disciplina: disc.disciplina!,
      conceito: discipline.conceito!,
      creditos: discipline.creditos!,
      cr_acumulado: coef?.cr_acumulado ?? get(coef, 'cr_acumulado'),
      ca_acumulado: coef?.ca_acumulado ?? get(coef, 'ca_acumulado'),
      cp_acumulado: coef?.cp_acumulado ?? get(coef, 'cp_acumulado'),
    };

    // @ts-expect-error I hate mongoose
    const modifiedPayload = modifyPayload(enrollmentPayload, subjects, {});

    await EnrollmentModel.findOneAndUpdate(
      {
        // TODO: remove any later
        identifier: discipline.identifier,
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

  return batchInsertItems(disciplinesArr, (discipline) =>
    // @ts-expect-error
    updateOrCreateEnrollments(discipline),
  );
}

function checkAndFixCourseName(courseName: string) {
  return courseName === 'Bacharelado em CIências e Humanidades'
    ? 'Bacharelado em Ciências e Humanidades'
    : courseName;
}

function getLastPeriod(
  disciplines: Record<string, unknown>,
  year: number,
  quad: number,
  begin?: string,
): Coefficient | null {
  if (!begin) {
    const firstYear = Object.keys(disciplines)[0];
    const firstMonth = Object.keys(disciplines[firstYear]!)[0];
    begin = `${firstYear}.${firstMonth}`!;
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
    return getLastPeriod(disciplines, year, quad, begin)!;
  }

  return resp as Coefficient;
}

export const updaterUserEnrollmentsQueue = createQueue(
  'UserEnrollments:Update',
);

export const addUserEnrollmentsToQueue = async (payload: History) => {
  await updaterUserEnrollmentsQueue.add('UserEnrollments:Update', payload);
};

export const userEnrollmentsUpdateWorker = async (job: Job<History>) => {
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
