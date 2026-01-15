import { currentQuad, findQuarter } from '@next/common';
import { defineJob } from '@next/queues/client';
import { z } from 'zod';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { JOB_NAMES } from '@/constants.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { HistoryModel, type HistoryCoefficients } from '@/models/History.js';
import { StudentModel, type StudentCourse } from '@/models/Student.js';

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
        $nin: ['completed', 'created'],
      },
    });
    const jobDocument = await db.HistoryProcessingJob.findById(jobId);

    if (!jobDocument || !studentSync) {
      throw new Error(`Processing job with ID ${jobId} not found`);
    }

    await jobDocument.transition('in_queue', {
      note: 'Job started processing',
    });
    await studentSync.transition('in_queue', {
      note: 'Sync started processing',
    });
    try {
      await upsertStudentRecord(webhookData.payload, season);
      await createHistoryRecord(webhookData.payload);
      await dispatchEnrollmentsProcessing(webhookData.payload, jobId, app);

      await jobDocument.transition('completed', {
        note: 'Job completed successfully',
      });

      await studentSync.transition('completed', {
        note: 'finished',
      });
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

export const historyProcessingRetry = defineJob(
  JOB_NAMES.HISTORY_PROCESSING_RETRY
)
.every('15 minutes')
  .handler(async ({ app }) => {
  const connector = new UfabcParserConnector();
  const pendingStudentsSyncs = await app.db.StudentSync.find({
    status: 'awaiting',
  });

  if (!pendingStudentsSyncs.length) {
    return { success: true, message: 'No pending students syncs found' };
  }

  for (const studentSync of pendingStudentsSyncs) {
    const login = studentSync.timeline[0]?.metadata.login;
    if (!login) {
      app.log.info('Skipping student sync with missing login');
      continue;
    }

    const key = `${login}-${Date.now()}`;
    const formattedHistory = await connector.getStudentHistory(login);
    const job = await app.db.HistoryProcessingJob.insertOne({
      ra: formattedHistory.student.ra,
      idempotencyKey: key,
      payload: formattedHistory,
      source: 'retry',
    });

    await app.manager.dispatch(
      JOB_NAMES.HISTORY_PROCESSING,
      {
        jobId: job._id.toString(),
        webhookData: {
          type: 'history.success',
          payload: {
            ...formattedHistory,
            login: login,
          },
        },
      },
    );
  }

  return { success: true };
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
      {
        ra: Number(ra),
        curso: student.course.toLowerCase(),
        grade: student.campus,
      },
      { $set: historyData },
      { upsert: true }
    ),
  ]);
}

async function dispatchEnrollmentsProcessing(
  { ra, components, coefficients }: HistoryData,
  historyJobId: string,
  app: any
): Promise<void> {
  await app.manager.dispatch(JOB_NAMES.PROCESS_COMPONENTS_ENROLLMENTS, {
    ra: Number(ra),
    historyJobId,
    component: components,
    coefficients,
  });
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
