import { calculateCoefficients, generateIdentifier } from '@next/common';
import {
  GraduationModel,
  type GraduationDocument,
} from '@/models/Graduation.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { SubjectModel, type SubjectDocument } from '@/models/Subject.js';
import { EnrollmentModel, type Enrollment } from '@/models/Enrollment.js';
import {
  type History,
  type HistoryCoefficients,
  type HistoryDocument,
  HistoryModel,
} from '@/models/History.js';
import type { QueueContext } from '../types.js';

type HistoryComponent = History['disciplinas'][number];

export async function userEnrollmentsUpdate(
  ctx: QueueContext<HistoryDocument>,
) {
  const history = ctx.job.data;

  if (!history.disciplinas) {
    return;
  }

  const isComponents = Array.isArray(history.disciplinas)
    ? history.disciplinas
    : [history.disciplinas];
  const components = isComponents.filter(Boolean);
  let graduation: GraduationDocument | null = null;
  if (history.curso && history.grade) {
    graduation = await GraduationModel.findOne({
      curso: history.curso,
      grade: history.grade,
    });
  }

  const coefficients = calculateCoefficients<HistoryComponent>(
    components,
    graduation,
  ) as HistoryCoefficients;

  history.coefficients = coefficients;

  try {
    await HistoryModel.findOneAndUpdate(
      { ra: history.ra, grade: history.grade, curso: history.curso },
      {
        $set: {
          coefficients: history.coefficients,
        },
      },
    );
    await GraduationHistoryModel.findOneAndUpdate(
      {
        curso: history.curso,
        grade: history.grade,
        ra: history.ra,
      },
      {
        $set: {
          curso: history.curso,
          grade: history.grade,
          ra: history.ra,
          coefficients: history.coefficients,
          disciplinas: history.disciplinas,
          graduation: graduation ? graduation._id : null,
        },
      },
      { upsert: true },
    );

    const enrollmentJobs = components.map(async (component) => {
      try {
        await ctx.app.job.dispatch('ProcessComponentsEnrollments', {
          history,
          component,
        });
      } catch (error) {
        ctx.app.log.error({
          error: error instanceof Error ? error.message : String(error),
          component: component.disciplina,
          ra: history.ra,
          msg: 'Failed to dispatch component processing job',
        });
      }
    });

    await Promise.all(enrollmentJobs);
  } catch (error) {
    ctx.app.log.error({
      error: error instanceof Error ? error.message : String(error),
      ra: history.ra,
      msg: 'Failed to process student history',
    });
    throw error; // Let BullMQ handle the retry
  }
}

export async function processComponentEnrollment(
  ctx: QueueContext<{
    history: HistoryDocument;
    component: HistoryComponent;
  }>,
) {
  const { history, component } = ctx.job.data;

  const keys = ['ra', 'year', 'quad', 'disciplina'] as const;

  // Normalize just for generating the identifier consistently
  const normalizedDisciplina = component.disciplina.trim();

  const key = {
    ra: history.ra,
    year: component.ano,
    quad: Number(component.periodo),
    disciplina: normalizedDisciplina,
  };

  component.identifier = component.identifier || generateIdentifier(key, keys);

  const coef = getLastPeriod(
    history.coefficients,
    component.ano,
    Number.parseInt(component.periodo),
  );

  const subjects = await SubjectModel.find({}, { name: 1 }).lean<
    SubjectDocument[]
  >();

  const rawEnrollment = {
    ra: key.ra,
    year: key.year,
    quad: key.quad,
    disciplina: component.disciplina, // Keep the original disciplina
    conceito: component.conceito,
    creditos: component.creditos,
    cr_acumulado: coef?.cr_acumulado ?? null,
    ca_acumulado: coef?.ca_acumulado ?? null,
    cp_acumulado: coef?.cp_acumulado ?? null,
    season: `${key.year}:${key.quad}`,
  };

  const enrollmentWithSubject = mapSubjects(rawEnrollment, subjects);

  try {
    // First, find all existing enrollments that might be duplicates
    const existingEnrollments = await EnrollmentModel.find({
      ra: history.ra,
      year: component.ano,
      quad: Number(component.periodo),
    }).lean();

    // Check if any existing enrollment matches our component (case-insensitive)
    const matchingEnrollment = existingEnrollments.find(
      (enrollment) =>
        enrollment?.disciplina?.toLowerCase().trim() ===
        normalizedDisciplina.toLowerCase(),
    );

    // @ts-ignore
    let enrollment;

    if (matchingEnrollment) {
      enrollment = await EnrollmentModel.findByIdAndUpdate(
        matchingEnrollment._id,
        {
          $set: {
            ...enrollmentWithSubject[0],
            identifier: component.identifier,
          },
        },
        { new: true },
      );
    } else {
      // Create a new enrollment
      enrollment = await EnrollmentModel.create({
        ...enrollmentWithSubject[0],
        identifier: component.identifier,
      });
    }

    ctx.app.log.debug({
      msg: 'Enrollment processed successfully',
      enrollmentId: enrollment?._id,
      ra: enrollment?.ra,
      disciplina: enrollment?.disciplina,
    });
  } catch (error) {
    ctx.app.log.error({
      error: error instanceof Error ? error.message : String(error),
      component: component.disciplina,
      ra: history.ra,
      msg: 'Failed to update enrollment',
    });
    throw error;
  }
}

function getLastPeriod(
  coefficients: History['coefficients'],
  year: number,
  quad: number,
  begin?: string,
) {
  const firstYear = Object.keys(coefficients)[0];
  const firstMonth = Object.keys(coefficients[Number(firstYear)])[0];

  begin = `${firstYear}.${firstMonth}`;

  if (quad === 1) {
    quad = 3;
    year -= 1;
  } else if (quad === 2 || quad === 3) {
    quad -= 1;
  }

  if (begin > `${year}.${quad}`) {
    return null;
  }

  // @ts-ignore for now
  const resp = coefficients?.[year]?.[quad] ?? null;
  if (resp == null) {
    return getLastPeriod(coefficients, year, quad, begin);
  }

  return resp;
}

function mapSubjects(
  enrollment: Partial<Enrollment>,
  subjects: SubjectDocument[],
) {
  // Create a mapping of lowercase subject names for case-insensitive lookup
  const mapSubjects = subjects.map((subject) =>
    subject.search?.toLowerCase().trim(),
  );
  const enrollmentArray = Array.isArray(enrollment) ? enrollment : [enrollment];

  return enrollmentArray
    .reduce<Partial<Enrollment>[]>((acc, e: any) => {
      const disciplinaLower = e.disciplina.toLowerCase().trim();

      if (!mapSubjects.includes(disciplinaLower)) {
        acc.push(e);
      }

      const subject = subjects.find(
        (s) => s.name?.toLowerCase().trim() === disciplinaLower,
      );
      e.subject = subject?._id.toString() ?? null;

      return acc;
    }, [])
    .filter(
      (e): e is Partial<Enrollment> =>
        e.disciplina !== '' && e.disciplina != null,
    );
}
