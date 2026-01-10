import type { QueryFilter as FilterQuery } from 'mongoose';

import { currentQuad, findQuarter } from '@next/common';
import { defineJob } from '@next/queues/client';
import { FastifyBaseLogger } from 'fastify';
import { z } from 'zod';

import { JOB_NAMES } from '@/constants.js';
import { ComponentModel } from '@/models/Component.js';
import { EnrollmentModel, type Enrollment } from '@/models/Enrollment.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { HistoryModel, type HistoryCoefficients } from '@/models/History.js';
import type { SubjectDocument } from '@/models/Subject.js';
import { StudentModel, type StudentCourse } from '@/models/Student.js';
import { findOrCreateSubject } from './utils/subject-resolution.js';

import { HistoryWebhookPayloadSchema } from '../schemas/v2/webhook/history.js';

const jobSchema = z.object({
  jobId: z.string().describe('Processing job ID'),
  webhookData: z.object({
    type: z.enum(['history.success', 'history.error']),
    payload: HistoryWebhookPayloadSchema.extend({
      login: z.string().describe('Student login'),
    }),
  }),
});

type JobData = z.infer<typeof jobSchema>;

type HistoryData = JobData['webhookData']['payload'];

export const historyProcessingJob = defineJob(JOB_NAMES.HISTORY_PROCESSING)
  .input(jobSchema)
  .handler(async ({ job, app }) => {
    const { jobId, webhookData } = job.data;
    const season = currentQuad();
    const db = app.db;
    const studentSync = await db.StudentSync.findOne({
      ra: webhookData.payload.ra,
      status: { 
        $nin: ['completed', 'created']
      }
    });
    const jobDocument = await db.HistoryProcessingJob.findById(jobId);

    if (!jobDocument || !studentSync) {
      throw new Error(`Processing job with ID ${jobId} not found`);
    }

    await jobDocument.transition('in_queue', {
      note: 'Job started processing',
    });
    await studentSync.transition('in_queue', {
      note: 'Sync started processing'
    })
    try {
      await upsertStudentRecord(webhookData.payload, season);
      await createHistoryRecord(webhookData.payload);
      await processCurrentEnrollments(webhookData.payload, app.log);

      await jobDocument.transition('completed', {
        note: 'Job completed successfully',
      });

      await studentSync.transition('completed', {
        note: 'finished'
      })
      return { success: true };
    } catch (processingError: any) {
      await jobDocument.transition('failed', {
        note: `Job failed: ${processingError.message}`,
        details: processingError,
      });

      app.log.error(
        {
          attemptsMade: job.attemptsMade,
          error: processingError,
        },
        'Job permanently failed'
      );
      return {
        success: false,
        error: processingError,
      };
    }
  });

async function upsertStudentRecord(data: HistoryData, season: string) {
  const { student, coefficients, login, ra } = data;
  const courseData: StudentCourse = {
    nome_curso: student.course,
    turno: student.shift as StudentCourse['turno'],
    ind_afinidade: coefficients.ik,
    cp: coefficients.cp,
    cr: coefficients.cr,
    ca: coefficients.ca,
  };

  await StudentModel.updateOne(
    { ra: Number(ra), season },
    {
      login,
      $push: { cursos: courseData },
    },

    { upsert: true }
  );
}

async function createHistoryRecord({
  coefficients,
  components,
  student,
  ra,
}: HistoryData) {
  const historyData = {
    ra: Number(ra),
    curso: student.course.toLowerCase(),
    grade: student.campus,
    disciplinas: components.map(transformComponentToHistory),
    coefficients: transformCoefficients(coefficients),
  };

  await Promise.all([
    HistoryModel.findOneAndUpdate(
      { ra: Number(ra) },
      { $set: historyData },
      { upsert: true }
    ),
    GraduationHistoryModel.findOneAndUpdate(
      { ra: Number(ra), curso: student.course.toLowerCase(), grade: student.campus },
      { $set: historyData },
      { upsert: true }
    ),
  ]);
}

async function processCurrentEnrollments(
  { ra, components, coefficients }: HistoryData,
  log: FastifyBaseLogger
) {
  const historyData = { ra: Number(ra), coefficients };

  for (const component of components.map(transformComponentToHistory)) {
    try {
      const enrollmentData = await buildEnrollmentData(
        historyData,
        component,
        log
      );

      if (!enrollmentData) {
        log.warn(
          {
            ra: Number(ra),
            disciplina: component.name,
            turma: component.turma,
          },
          'Could not build enrollment data for component'
        );
        continue;
      }

      await upsertEnrollment(enrollmentData, log);
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : String(error),
          ra: Number(ra),
          disciplina: component.name,
          turma: component.class,
        },
        'Failed to process current enrollment'
      );
      throw error;
    }
  }
}

function transformComponentToHistory(component: any) {
  return {
    periodo: component.period,
    codigo: component.UFCode,
    disciplina: component.name,
    ano: Number(component.year),
    situacao: component.status,
    creditos: component.credits,
    categoria: component.category,
    conceito: component.grade,
    turma: component.class || '',
    teachers: component.teachers || [],
  };
}

function transformCoefficients(coefficients: any): HistoryCoefficients {
  const { year } = findQuarter();
  const result: HistoryCoefficients = {};

  for (let y = year - 5; y <= year; y++) {
    result[y] = {
      '1': {
        ca_quad: coefficients.ca || 0,
        ca_acumulado: coefficients.ca || 0,
        cr_quad: coefficients.cr || 0,
        cr_acumulado: coefficients.cr || 0,
        cp_acumulado: coefficients.cp || 0,
        percentage_approved: 0,
        accumulated_credits: 0,
        period_credits: 0,
      },
      '2': {
        ca_quad: coefficients.ca || 0,
        ca_acumulado: coefficients.ca || 0,
        cr_quad: coefficients.cr || 0,
        cr_acumulado: coefficients.cr || 0,
        cp_acumulado: coefficients.cp || 0,
        percentage_approved: 0,
        accumulated_credits: 0,
        period_credits: 0,
      },
      '3': {
        ca_quad: coefficients.ca || 0,
        ca_acumulado: coefficients.ca || 0,
        cr_quad: coefficients.cr || 0,
        cr_acumulado: coefficients.cr || 0,
        cp_acumulado: coefficients.cp || 0,
        percentage_approved: 0,
        accumulated_credits: 0,
        period_credits: 0,
      },
    };
  }

  return result;
}

async function upsertEnrollment(
  enrollmentData: Partial<Enrollment>,
  log: FastifyBaseLogger
): Promise<void> {
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

function extractTurma(turmaRaw: string): string | null {
  const turmaStr = turmaRaw.startsWith('F') ? turmaRaw.slice(1) : turmaRaw;
  const match = turmaStr.match(/^[A-Z]([A-Z]\d{0,2})/i);
  return match ? match[1] : null;
}

function getLastPeriod(
  coefficients: HistoryCoefficients,
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
  history: { ra: number; coefficients: HistoryCoefficients },
  component: any,
  log: FastifyBaseLogger
) {
  const campus = getCampusFromTurma(component.turma);
  const turno = getTurnoFromTurma(component.turma);
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
    campus,
    turno,
  };

  const matchingComponent = await ComponentModel.findOne({
    uf_cod_turma: component.turma,
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
      codigo: component.UFCode,
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

  const subject = await findOrCreateSubject(component.disciplina.toLowerCase(), component.creditos, normalizedCode);

  if (!subject) {
    log.warn(
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
    log.warn(
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

  if (!baseData.turma || baseData.turma === '--' || baseData.turma === '-') {
    log.warn(
      {
        component,
        baseData,
        ra: baseData.ra,
        disciplina: baseData.disciplina,
      },
      'No valid turma provided, cannot generate UFClassroomCode'
    );
    return mappedEnrollment;
  }

  const turma = extractTurma(baseData.turma);

  if (!turma) {
    log.warn(
      { turmaRaw: baseData.turma, component, baseData },
      'Turma format did not match expected pattern'
    );
    const error = new Error('Invalid turma format') as any;
    error.cause = baseData.turma;
    throw error;
  }

  if (!baseData.turno || !baseData.campus) {
    log.warn(
      {
        turno: baseData.turno,
        campus: baseData.campus,
        ra: baseData.ra,
        disciplina: baseData.disciplina,
      },
      'Missing turno or campus data, cannot generate UFClassroomCode'
    );
    return mappedEnrollment;
  }

  const turnoPrefix = baseData.turno?.slice(0, 1).toUpperCase() || '';
  const campusSuffix = baseData.campus?.slice(0, 2) || '';
  const UFClassroomCode = `${turnoPrefix}${turma.toUpperCase()}${component.codigo}${campusSuffix}`;

  mappedEnrollment.uf_cod_turma = UFClassroomCode;

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
