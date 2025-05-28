import type { FilterQuery } from 'mongoose';
import { calculateCoefficients, generateIdentifier } from '@next/common';
import {
  GraduationModel,
  type GraduationDocument,
} from '@/models/Graduation.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { SubjectModel, type SubjectDocument } from '@/models/Subject.js';
import { EnrollmentModel, type Enrollment } from '@/models/Enrollment.js';
import { ComponentModel, type Component } from '@/models/Component.js';
import {
  type History,
  type HistoryCoefficients,
  HistoryModel,
} from '@/models/History.js';
import type { QueueContext } from '../types.js';

type HistoryComponent = History['disciplinas'][number];

export async function userEnrollmentsUpdate(
  ctx: QueueContext<History | undefined>,
) {
  const history = ctx.job.data;

  if (!history || !history.disciplinas) {
    ctx.app.log.warn({
      msg: 'No history data found or no disciplines to process',
      job_data_debug: ctx.job,
    });
    return;
  }

  const { disciplinas: components, ra, curso, grade } = history;

  let graduation: GraduationDocument | null = null;
  if (curso && grade) {
    graduation = await GraduationModel.findOne({
      curso,
      grade,
    });
  }

  const coefficients = calculateCoefficients<HistoryComponent>(
    components,
    graduation,
  ) as HistoryCoefficients;

  try {
    await HistoryModel.findOneAndUpdate(
      { ra, grade, curso },
      {
        $set: {
          curso,
          grade,
          ra,
          coefficients,
          disciplinas: components,
          graduation: graduation?._id ?? null,
        },
      },
    );
    await GraduationHistoryModel.findOneAndUpdate(
      {
        curso,
        grade,
        ra,
      },
      {
        $set: {
          curso,
          grade,
          ra,
          coefficients,
          disciplinas: components,
          graduation: graduation?._id ?? null,
        },
      },
      { upsert: true },
    );

    const enrollmentJobs = components.map(async (component) => {
      try {
        await ctx.app.job.dispatch('ProcessComponentsEnrollments', {
          history: {
            ra,
            coefficients,
          },
          component,
        });
      } catch (error) {
        ctx.app.log.error({
          error: error instanceof Error ? error.message : String(error),
          component: component.disciplina,
          ra: history.ra,
          msg: 'Failed to dispatch enrollment processing job',
        });
        throw error;
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

// 1.
// enrollment -> subject -> sync matriculas deferidas -> components -> poder comentar
// 2.
// enrollment -> components -> poder comentar
//          -> sync matriculas deferidas (double check)

export async function processComponentEnrollment(
  ctx: QueueContext<{
    history: {
      ra: number;
      coefficients: HistoryCoefficients;
    };
    component: HistoryComponent;
  }>,
) {
  const { history, component } = ctx.job.data;

  const compositeKeyHashKeys = ['ra', 'year', 'quad', 'disciplina'] as const;
  const compositeKeyHashValues = {
    ra: history.ra,
    year: component.ano,
    quad: Number(component.periodo),
    disciplina: component.disciplina,
  };

  const { UFCode, className, shift } = parseComponentCode(component.turma);
  const campus =
    component.turma.slice(-2).toLowerCase() === 'sb' ? 'sbc' : 'sa';
  const turno = shift.toLowerCase() === 'n' ? 'noturno' : 'diurno';

  const searchCriteria = {
    codigo: component.codigo ?? UFCode,
    campus,
    turno,
    turma: className,
    season: `${compositeKeyHashValues.year}:${compositeKeyHashValues.quad}`,
  } satisfies FilterQuery<Component>;

  const matchingClassComponent =
    await ComponentModel.findOne(searchCriteria).lean();

  const coef = getLastPeriod(
    history.coefficients,
    component.ano,
    Number.parseInt(component.periodo),
  );

  let enrollmentBuilder: Partial<Enrollment>;

  if (matchingClassComponent) {
    enrollmentBuilder = {
      ra: history.ra,
      year: compositeKeyHashValues.year,
      quad: compositeKeyHashValues.quad,

      disciplina: component.disciplina,
      disciplina_id: matchingClassComponent.disciplina_id,
      conceito: component.conceito,
      creditos: component.creditos,

      cr_acumulado: coef?.cr_acumulado ?? null,
      ca_acumulado: coef?.ca_acumulado ?? null,
      cp_acumulado: coef?.cp_acumulado ?? null,

      campus: matchingClassComponent.campus,
      turma: matchingClassComponent.turma,
      turno: matchingClassComponent.turno,
      pratica: matchingClassComponent.pratica,
      teoria: matchingClassComponent.teoria,
      subject: matchingClassComponent.subject,

      identifier:
        component.identifier ??
        generateIdentifier(compositeKeyHashValues, compositeKeyHashKeys),
      season: `${compositeKeyHashValues.year}:${compositeKeyHashValues.quad}`,
    };
  } else {
    // Fallback to subject search only if no component found
    const nameRegex = new RegExp(`.*${component.disciplina}.*`);
    const subjects = await SubjectModel.find({
      $or: [
        { name: { $regex: nameRegex, $options: 'i' } },
        { search: { $regex: nameRegex, $options: 'i' } },
      ],
    }).lean<SubjectDocument[]>();

    if (!subjects.length) {
      ctx.app.log.warn({
        msg: 'No matching component or subject found',
        disciplina: component.disciplina,
        ra: history.ra,
      });
      return;
    }

    const [mappedEnrollment] = mapSubjects(
      {
        ra: history.ra,
        year: compositeKeyHashValues.year,
        quad: compositeKeyHashValues.quad,
        disciplina: component.disciplina,
        conceito: component.conceito,
        creditos: component.creditos,
        campus,
        turma: className,
        turno,
        cr_acumulado: coef?.cr_acumulado ?? null,
        ca_acumulado: coef?.ca_acumulado ?? null,
        cp_acumulado: coef?.cp_acumulado ?? null,
        season: `${compositeKeyHashValues.year}:${compositeKeyHashValues.quad}`,
        identifier:
          component.identifier ||
          generateIdentifier(compositeKeyHashValues, compositeKeyHashKeys),
      },
      subjects,
    );

    if (!mappedEnrollment) {
      ctx.app.log.warn(
        { component, history },
        'Very very bad could not match history',
      );
      return;
    }
    enrollmentBuilder = mappedEnrollment;
  }

  try {
    // First, find all existing enrollments that might be duplicates
    const enrollment = await EnrollmentModel.findOneAndUpdate(
      {
        ra: history.ra,
        year: component.ano,
        quad: Number(component.periodo),
        conceito: component.conceito,
        disciplina: component.disciplina,
      },
      { $set: enrollmentBuilder },
      { new: true, upsert: true },
    );

    ctx.app.log.debug({
      msg: 'Enrollment processed successfully',
      enrollmentId: enrollment?.identifier,
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

function parseComponentCode(classCode: string) {
  const regexSingleHyphen =
    /^([NDM])([A-Zaz]+\d{1,2})([A-Z]+\d{4})-(\d{2})([SA-B]{2})$/;

  const match = classCode.match(regexSingleHyphen);

  if (!match) {
    throw new Error('Could not parse code');
  }

  const [_, shift, className, UFCode, year, campus] = match;

  return {
    shift,
    className,
    UFCode,
    year,
    campus,
    fullCode: classCode,
  };
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
