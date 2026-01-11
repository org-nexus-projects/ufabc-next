import type { QueryFilter as FilterQuery } from 'mongoose';

import { defineJob } from '@next/queues/client';
import { FastifyBaseLogger } from 'fastify';
import { z } from 'zod';

import type { SubjectDocument } from '@/models/Subject.js';

import { JOB_NAMES } from '@/constants.js';
import { ComponentModel } from '@/models/Component.js';
import { EnrollmentModel, type Enrollment } from '@/models/Enrollment.js';

import { findOrCreateSubject } from './utils/subject-resolution.js';

const jobSchema = z.object({
  ra: z.number(),
  component: z
    .object({
      period: z.string(),
      UFCode: z.string(),
      name: z.string().toLowerCase(),
      year: z.string(),
      status: z.string(),
      credits: z.number(),
      category: z.string(),
      grade: z.string(),
      class: z.string(),
      teachers: z.array(z.any()).optional(),
    })
    .array(),
  coefficients: z.object({
    ca: z.number().optional(),
    cr: z.number(),
    cp: z.number().optional(),
  }),
});

type Component = z.infer<typeof jobSchema>['component'][number];

export const enrollmentsProcessingJob = defineJob(
  JOB_NAMES.PROCESS_COMPONENTS_ENROLLMENTS
)
  .input(jobSchema)
  .iterator('component')
  .concurrency(5)
  .handler(async ({ job, app }) => {
    const { ra, component, coefficients } = job.data;
    const log = app.log;
    const historyData = { ra, coefficients };

    const partialEnrollment = transformComponentToEnrollment(component);

    try {
      const enrollmentData = await buildEnrollmentData(
        historyData,
        partialEnrollment,
        log
      );

      if (!enrollmentData) {
        log.warn(
          {
            ra,
            disciplina: partialEnrollment.disciplina,
            turma: partialEnrollment.turma,
          },
          'Could not build enrollment data for component'
        );
        return {
          success: false,
          message: 'Could not build enrollment data for component',
          skipped: true,
        };
      }

      const enrollmentId = await upsertEnrollment(enrollmentData, log);

      if (!enrollmentId) {
        log.warn(
          {
            ra,
            disciplina: partialEnrollment.disciplina,
            turma: partialEnrollment.turma,
          },
          'Could not build enrollment data for component'
        );
        return {
          success: false,
          message: 'Could not build enrollment data for component',
          skipped: true,
        };
      }

      return {
        success: true,
        message: 'Enrollment processed successfully',
        data: {
          enrollmentId,
          disciplina: partialEnrollment.disciplina,
          ra: ra,
          turma: partialEnrollment.turma,
        },
      };
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : String(error),
          ra,
          disciplina: partialEnrollment.disciplina,
          turma: partialEnrollment.turma,
        },
        'Failed to process current enrollment'
      );
      throw error;
    }
  });

function transformComponentToEnrollment(component: Component) {
  return {
    periodo: component.period,
    codigo: component.UFCode,
    disciplina: component.name,
    ano: Number(component.year),
    situacao: component.status,
    creditos: component.credits,
    categoria: component.category,
    conceito: component.grade,
    turma: component.class?.slice(1, 3) || '',
    uf_cod_turma: component.class,
    teachers: component.teachers || [],
  };
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

function getCampusFromTurma(turma: string | null | undefined): string | null {
  if (!turma || turma === '--' || turma === '-') {
    return null;
  }

  const campus = turma.slice(-2).toUpperCase();
  if (campus !== 'SA' && campus !== 'SB' && campus !== 'AA') {
    const error = new Error('Invalid campus') as any;
    error.cause = campus;
    throw error;
  }
  return campus === 'SA' || campus === 'AA' ? 'sa' : 'sbc';
}

function getTurnoFromTurma(turma: string | null | undefined): string | null {
  if (!turma || turma === '--' || turma === '-') {
    return null;
  }
  return turma.slice(0, 1).toUpperCase() === 'N' ? 'noturno' : 'diurno';
}

function getLastPeriod(
  coefficients: any,
  year: number,
  quad: number,
  begin?: string
) {
  if (!coefficients || Object.keys(coefficients).length === 0) {
    return null;
  }

  const firstYear = Object.keys(coefficients)[0];
  const firstYearCoefficients = coefficients[Number(firstYear)];

  if (!firstYearCoefficients) {
    return null;
  }

  const firstMonth = Object.keys(firstYearCoefficients)[0];

  if (!firstMonth) {
    return null;
  }

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

  const resp =
    coefficients?.[localYear as keyof typeof coefficients]?.[
      localQuad as unknown as '1' | '2' | '3'
    ] ?? null;
  if (resp == null) {
    return getLastPeriod(coefficients, localYear, localQuad, begin);
  }

  return resp;
}

async function buildEnrollmentData(
  history: { ra: number; coefficients: any },
  component: ReturnType<typeof transformComponentToEnrollment>,
  log: FastifyBaseLogger
) {
  const campus = getCampusFromTurma(component.uf_cod_turma);
  const turno = getTurnoFromTurma(component.uf_cod_turma);
  const coef = getLastPeriod(
    history.coefficients,
    component.ano,
    Number.parseInt(component.periodo)
  );

  const baseEnrollmentData: Partial<Enrollment> = {
    ra: history.ra,
    year: component.ano,
    quad: Number(component.periodo),
    disciplina: component.disciplina.toLowerCase(),
    conceito: component.conceito,
    creditos: component.creditos,
    cr_acumulado: coef?.cr_acumulado,
    ca_acumulado: coef?.ca_acumulado ?? null,
    cp_acumulado: coef?.cp_acumulado ?? null,
    season: `${component.ano}:${component.periodo}`,
    kind: null,
    syncedBy: 'extension',
    turma: component.turma,
    uf_cod_turma: component.uf_cod_turma,
    campus,
    turno,
  };

  const matchingComponent = await ComponentModel.findOne({
    uf_cod_turma: baseEnrollmentData.uf_cod_turma,
    season: baseEnrollmentData.season,
  }).lean();

  if (matchingComponent) {
    log.info('Using matching class component');
    return {
      ...baseEnrollmentData,
      disciplina_id: matchingComponent.disciplina_id,
      turma: matchingComponent.turma,
      pratica: matchingComponent.pratica,
      teoria: matchingComponent.teoria,
      subject: matchingComponent.subject,
      uf_cod_turma: matchingComponent.uf_cod_turma,
    };
  }

  log.info(
    {
      disciplina: component.disciplina,
      ra: history.ra,
      turma: component.turma,
      creditos: component.creditos,
      season: baseEnrollmentData.season,
      codigo: component.codigo,
    },
    'Using subject match for sync'
  );
  return buildEnrollmentFromSubject({ ...baseEnrollmentData }, component, log);
}

async function buildEnrollmentFromSubject(
  baseData: Partial<Enrollment>,
  component: any,
  log: FastifyBaseLogger
): Promise<Partial<Enrollment> | null> {
  const normalizedCode = component.codigo.split('-')[0];

  const subject = await findOrCreateSubject(
    component.disciplina.toLowerCase(),
    component.creditos,
    normalizedCode
  );

  if (!subject) {
    log.error(
      {
        original: component.codigo,
        normalized: normalizedCode,
        creditos: component.creditos,
        ra: baseData.ra,
      },
      'Subject creation failed'
    );
    return null;
  }

  const subjects = [subject];

  const mappedEnrollments = mapSubjects(baseData, subjects);

  if (!mappedEnrollments.length) {
    log.error(
      {
        component,
        baseData,
        ra: baseData.ra,
        disciplina: baseData.disciplina,
      },
      'No mapped enrollments returned from mapSubjects'
    );
    return null;
  }

  const [mappedEnrollment] = mappedEnrollments;

  if (
    !baseData.uf_cod_turma ||
    baseData.uf_cod_turma === '--' ||
    baseData.uf_cod_turma === '-'
  ) {
    log.warn(
      {
        component,
        baseData,
        ra: baseData.ra,
        disciplina: baseData.disciplina,
      },
      'No valid turma provided, cannot generate uf_cod_turma'
    );
    return mappedEnrollment;
  }

  mappedEnrollment.uf_cod_turma = baseData.uf_cod_turma;

  return mappedEnrollment;
}

function mapSubjects(
  enrollment: Partial<Enrollment>,
  subjects: SubjectDocument[]
): Partial<Enrollment>[] {
  const enrollmentArray = (
    Array.isArray(enrollment) ? enrollment : [enrollment]
  ) as Partial<Enrollment>[];

  return enrollmentArray
    .map((e) => {
      const codeMatch = (e.disciplina ?? '').match(/^(.*?)-\d{2}$/);
      const normalizedCode = codeMatch ? codeMatch[1] : (e.disciplina ?? '');
      const subject = subjects.find(
        (s) =>
          Array.isArray(s.uf_subject_code) &&
          s.uf_subject_code.includes(normalizedCode)
      );
      if (subject) {
        return {
          ...e,
          subject: subject._id.toString(),
        };
      }
      return e;
    })
    .filter(
      (e): e is Partial<Enrollment> =>
        e.disciplina !== '' && e.disciplina != null
    );
}

async function upsertEnrollment(
  enrollmentData: Partial<Enrollment>,
  log: FastifyBaseLogger
): Promise<string | null> {
  // @ts-ignore - Mongoose FilterQuery type
  const base: FilterQuery<Enrollment> = {
    ra: enrollmentData.ra,
    season: enrollmentData.season,
  };

  let query = { ...base, uf_cod_turma: enrollmentData.uf_cod_turma };
  let enrollment = await EnrollmentModel.findOneAndUpdate(
    query,
    { $set: enrollmentData },
    { new: true }
  );

  if (!enrollment && enrollmentData.disciplina_id) {
    // @ts-ignore - Mongoose FilterQuery type
    query = { ...base, disciplina_id: enrollmentData.disciplina_id };
    enrollment = await EnrollmentModel.findOneAndUpdate(
      query,
      { $set: enrollmentData },
      { new: true }
    );
  }

  if (!enrollment && enrollmentData.subject) {
    // @ts-ignore - Mongoose FilterQuery type
    query = { ...base, subject: enrollmentData.subject };
    enrollment = await EnrollmentModel.findOneAndUpdate(
      query,
      { $set: enrollmentData },
      { new: true }
    );
  }

  if (!enrollment && enrollmentData.disciplina) {
    const normalizedDisciplina = normalizeText(enrollmentData.disciplina);
    // @ts-ignore - Mongoose FilterQuery type
    query = {
      ...base,
      disciplina: { $regex: normalizedDisciplina, $options: 'i' },
    } as FilterQuery<Enrollment>;
    enrollment = await EnrollmentModel.findOneAndUpdate(
      query,
      { $set: enrollmentData },
      { new: true }
    );
  }

  if (!enrollment) {
    enrollment = await EnrollmentModel.create(enrollmentData);
    log.debug({
      enrollmentId: enrollment?.identifier,
      ra: enrollment?.ra,
      disciplina: enrollment?.disciplina,
      uf_cod_turma: enrollment?.uf_cod_turma,
      season: enrollment?.season,
    });
  } else {
    log.debug(
      {
        enrollmentId: enrollment?.identifier,
        ra: enrollment?.ra,
        disciplina: enrollment?.disciplina,
        uf_cod_turma: enrollment?.uf_cod_turma,
        season: enrollment?.season,
      },
      'Enrollment updated'
    );
  }

  return enrollment?._id?.toString() || null;
}
