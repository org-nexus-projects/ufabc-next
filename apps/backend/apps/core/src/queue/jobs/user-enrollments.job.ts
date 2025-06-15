import { calculateCoefficients } from '@next/common';
import {
  GraduationModel,
  type GraduationDocument,
} from '@/models/Graduation.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { SubjectModel, type SubjectDocument } from '@/models/Subject.js';
import { EnrollmentModel, type Enrollment } from '@/models/Enrollment.js';
import { ComponentModel } from '@/models/Component.js';
import {
  type History,
  type HistoryCoefficients,
  HistoryModel,
} from '@/models/History.js';
import { logger } from '@/utils/logger.js';
import type { QueueContext } from '../types.js';

type HistoryComponent = History['disciplinas'][number];

type ProcessComponentData = {
  history: {
    ra: number;
    coefficients: HistoryCoefficients;
  };
  component: HistoryComponent;
};

// Main job handler for processing user enrollment history
export async function userEnrollmentsUpdate(
  ctx: QueueContext<History | undefined>,
) {
  const history = ctx.job.data;

  if (!isValidHistory(history)) {
    const invalidHistoryError = new Error(
      'Invalid history structure or missing required fields',
      {
        cause: history,
      },
    );
    ctx.app.log.warn({
      msg: 'Invalid history data provided',
      job_data_debug: ctx.job.data,
    });
    // move to retry
    throw invalidHistoryError;
  }

  const { disciplinas: components, ra, curso, grade } = history;

  try {
    const graduation = await findGraduation(curso, grade, ctx.app.log);
    const coefficients = calculateHistoryCoefficients(components, graduation);

    await updateHistoryRecords(history, coefficients, graduation);
    await dispatchEnrollmentJobs(components, { ra, coefficients }, ctx.app);

    ctx.app.log.info({
      msg: 'Student history processed successfully',
      ra,
      componentsCount: components.length,
    });
  } catch (error) {
    ctx.app.log.error({
      error: error instanceof Error ? error.message : String(error),
      ra: history.ra,
      msg: 'Failed to process student history',
    });
    throw error;
  }
}

// 1.
// enrollment -> subject -> sync matriculas deferidas -> components -> poder comentar
// 2.
// enrollment -> components -> poder comentar
//          -> sync matriculas deferidas (double check)

export async function processComponentEnrollment(
  ctx: QueueContext<ProcessComponentData>,
) {
  const { history, component } = ctx.job.data;

  try {
    const enrollmentData = await buildEnrollmentData(
      history,
      component,
      ctx.app.log,
    );

    if (!enrollmentData) {
      ctx.app.log.warn({
        msg: 'Could not build enrollment data',
        ra: history.ra,
        disciplina: component.disciplina,
      });
      return;
    }

    await upsertEnrollment(enrollmentData, ctx.app.log);

    ctx.app.log.debug({
      msg: 'Component enrollment processed successfully',
      ra: history.ra,
      disciplina: component.disciplina,
    });
  } catch (error) {
    ctx.app.log.error({
      error: error instanceof Error ? error.message : String(error),
      component: component.disciplina,
      ra: history.ra,
      msg: 'Failed to process component enrollment',
    });
    throw error;
  }

  const campus =
    component.turma.slice(-2).toUpperCase() === 'SA' ? 'SA' : 'SBC';
  const turno =
    component.turma.slice(0, 1).toUpperCase() === 'N' ? 'noturno' : 'diurno';

  const matchingClassComponent = await ComponentModel.findOne({
    uf_cod_turma: component.turma,
  }).lean();

  const coef = getLastPeriod(
    history.coefficients,
    component.ano,
    Number.parseInt(component.periodo),
  );

  let enrollmentBuilder: Partial<Enrollment>;

  if (matchingClassComponent) {
    ctx.app.log.info('using match class component');
    enrollmentBuilder = {
      ra: history.ra,
      year: component.ano,
      quad: Number(component.periodo),

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
      season: `${component.ano}:${component.periodo}`,
    };
  } else {
    // Fallback to subject search only if no component found
    ctx.app.log.info('using subject match for sync');
    const normalizedDisciplina = normalizeText(component.disciplina);
    const subjects = await SubjectModel.find({
      $or: [
        // Exact match on normalized name
        { search: normalizedDisciplina },
        // Partial match on normalized name
        { search: { $regex: normalizedDisciplina, $options: 'i' } },
        // Match individual words
        {
          search: {
            $regex: normalizedDisciplina
              .split(/\s+/)
              .map((word) => `(?=.*${word})`)
              .join(''),
            $options: 'i',
          },
        },
        // Original name matching
        { name: { $regex: component.disciplina, $options: 'i' } },
      ],
      creditos: component.creditos,
    }).lean<SubjectDocument[]>();

    if (!subjects.length) {
      ctx.app.log.warn({
        msg: 'Subject matching failed',
        original: component.disciplina,
        normalized: normalizedDisciplina,
        creditos: component.creditos,
        ra: history.ra,
      });
      return;
    }

    const [mappedEnrollment] = mapSubjects(
      {
        ra: history.ra,
        year: component.ano,
        quad: Number(component.periodo),
        disciplina: component.disciplina,
        conceito: component.conceito,
        creditos: component.creditos,
        campus,
        turma: component.turma,
        turno,
        cr_acumulado: coef?.cr_acumulado ?? null,
        ca_acumulado: coef?.ca_acumulado ?? null,
        cp_acumulado: coef?.cp_acumulado ?? null,
        season: `${component.ano}:${component.periodo}`,
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
    const enrollment = await EnrollmentModel.findOneAndUpdate(
      {
        ra: history.ra,
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

  const beginValue = begin ?? `${firstYear}.${firstMonth}`;

  let localYear = year;
  let localQuad = quad;

  if (localQuad === 1) {
    localQuad = 3;
    localYear -= 1;
  } else if (localQuad === 2 || localQuad === 3) {
    localQuad -= 1;
  }

  if (beginValue > `${localYear}.${localQuad}`) {
    return null;
  }

  // @ts-ignore for now
  const resp = coefficients?.[localYear]?.[localQuad] ?? null;
  if (resp == null) {
    return getLastPeriod(coefficients, localYear, localQuad, begin);
  }

  return resp;
}

function mapSubjects(
  enrollment: Partial<Enrollment>,
  subjects: SubjectDocument[],
): Partial<Enrollment>[] {
  const enrollmentArray = (
    Array.isArray(enrollment) ? enrollment : [enrollment]
  ) as Partial<Enrollment>[];

  return enrollmentArray
    .map((e) => {
      // Find matching subject using normalized comparison
      const subject = subjects.find(
        (s) => normalizeText(s.name) === normalizeText(e.disciplina ?? ''),
      );

      if (subject) {
        return {
          ...e,
          subject: subject._id.toString(),
        };
      }

      logger.warn({
        msg: 'No subject match found after normalization',
        disciplina: e.disciplina,
        availableSubjects: subjects.map((s) => s.name),
      });

      return e;
    })
    .filter(
      (e): e is Partial<Enrollment> =>
        e.disciplina !== '' && e.disciplina != null,
    );
}

// only needed for subject matching
function normalizeText(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      // biome-ignore lint/suspicious/noMisleadingCharacterClass: not needed
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim()
  );
}

async function findGraduation(
  curso: string | undefined,
  grade: string | undefined,
  log: QueueContext['app']['log'],
): Promise<GraduationDocument | null> {
  if (!curso || !grade) {
    return null;
  }

  log.info({ curso, grade }, 'Finding graduation');
  return GraduationModel.findOne({ curso, grade });
}

function calculateHistoryCoefficients(
  components: HistoryComponent[],
  graduation: GraduationDocument | null,
) {
  // @ts-ignore for now - maintaining original behavior
  return calculateCoefficients<HistoryComponent>(
    components,
    graduation,
  ) as HistoryCoefficients;
}

async function updateHistoryRecords(
  history: History,
  coefficients: HistoryCoefficients,
  graduation: GraduationDocument | null,
): Promise<void> {
  const { ra, curso, grade, disciplinas: components } = history;
  const updateData = {
    curso,
    grade,
    ra,
    coefficients,
    disciplinas: components,
    graduation: graduation?._id ?? null,
  };

  await Promise.all([
    HistoryModel.findOneAndUpdate({ ra, grade, curso }, { $set: updateData }),
    GraduationHistoryModel.findOneAndUpdate(
      { curso, grade, ra },
      { $set: updateData },
      { upsert: true },
    ),
  ]);
}

async function dispatchEnrollmentJobs(
  components: HistoryComponent[],
  historyData: { ra: number; coefficients: HistoryCoefficients },
  app: QueueContext['app'],
): Promise<void> {
  const dispatchPromises = components.map(async (component) => {
    try {
      await app.job.dispatch('ProcessComponentsEnrollments', {
        history: historyData,
        component,
      });
    } catch (error) {
      app.log.error({
        error: error instanceof Error ? error.message : String(error),
        component: component.disciplina,
        ra: historyData.ra,
        msg: 'Failed to dispatch enrollment processing job',
      });
      throw error;
    }
  });

  await Promise.all(dispatchPromises);
}

async function buildEnrollmentData(
  history: { ra: number; coefficients: HistoryCoefficients },
  component: HistoryComponent,
  log: QueueContext['app']['log'],
) {
  const campus = getCampusFromTurma(component.turma);
  const turno = getTurnoFromTurma(component.turma);
  const coef = getLastPeriod(
    history.coefficients,
    component.ano,
    Number.parseInt(component.periodo),
  );

  const baseEnrollmentData: Partial<Enrollment> = {
    ra: history.ra,
    year: component.ano,
    quad: Number(component.periodo),
    disciplina: component.disciplina,
    conceito: component.conceito,
    creditos: component.creditos,
    cr_acumulado: coef?.cr_acumulado,
    ca_acumulado: coef?.ca_acumulado ?? null,
    cp_acumulado: coef?.cp_acumulado ?? null,
    season: `${component.ano}:${component.periodo}`,
  };

  // Try to match with existing component first
  const matchingComponent = await ComponentModel.findOne({
    uf_cod_turma: component.turma,
  }).lean();

  if (matchingComponent) {
    log.info('Using matching class component');
    return {
      ...baseEnrollmentData,
      disciplina_id: matchingComponent.disciplina_id,
      campus: matchingComponent.campus,
      turma: matchingComponent.turma,
      turno: matchingComponent.turno,
      pratica: matchingComponent.pratica,
      teoria: matchingComponent.teoria,
      subject: matchingComponent.subject,
    };
  }

  log.info('Using subject match for sync');
  return buildEnrollmentFromSubject(
    { ...baseEnrollmentData, campus, turma: component.turma, turno },
    component,
    log,
  );
}

async function buildEnrollmentFromSubject(
  baseData: Partial<Enrollment>,
  component: HistoryComponent,
  log: QueueContext['app']['log'],
): Promise<Partial<Enrollment> | null> {
  const normalizedDisciplina = normalizeText(component.disciplina);

  const subjects = await SubjectModel.find({
    $or: [
      { search: normalizedDisciplina },
      { search: { $regex: normalizedDisciplina, $options: 'i' } },
      {
        search: {
          $regex: normalizedDisciplina
            .split(/\s+/)
            .map((word) => `(?=.*${word})`)
            .join(''),
          $options: 'i',
        },
      },
      { name: { $regex: component.disciplina, $options: 'i' } },
    ],
    creditos: component.creditos,
  }).lean<SubjectDocument[]>();

  if (!subjects.length) {
    log.warn({
      msg: 'Subject matching failed',
      original: component.disciplina,
      normalized: normalizedDisciplina,
      creditos: component.creditos,
      ra: baseData.ra,
    });
    return null;
  }

  const [mappedEnrollment] = mapSubjects(baseData, subjects);

  if (!mappedEnrollment) {
    log.warn({ component, baseData }, 'Could not match history to subject');
    return null;
  }

  return mappedEnrollment;
}

async function upsertEnrollment(
  enrollmentData: Partial<Enrollment>,
  log: QueueContext['app']['log'],
): Promise<void> {
  const enrollment = await EnrollmentModel.findOneAndUpdate(
    { ra: enrollmentData.ra },
    { $set: enrollmentData },
    { new: true, upsert: true },
  );

  log.debug({
    msg: 'Enrollment upserted successfully',
    enrollmentId: enrollment?.identifier,
    ra: enrollment?.ra,
    disciplina: enrollment?.disciplina,
  });
}

// helpers functions
function isValidHistory(history: History | undefined): history is History {
  return !!(history?.disciplinas?.length && history.ra);
}

function getCampusFromTurma(turma: string): string {
  return turma.slice(-2).toUpperCase() === 'SA' ? 'SA' : 'SBC';
}

function getTurnoFromTurma(turma: string): string {
  return turma.slice(0, 1).toUpperCase() === 'N' ? 'noturno' : 'diurno';
}
