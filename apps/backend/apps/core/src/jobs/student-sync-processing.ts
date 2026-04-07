import { currentQuad, findQuarter } from '@next/common';
import { defineJob } from '@next/queues/client';
import { z } from 'zod';

import { JOB_NAMES } from '@/constants.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { HistoryModel } from '@/models/History.js';
import { StudentModel, type StudentCourse } from '@/models/Student.js';

import {
  StudentFailedEventSchema,
  StudentSyncedEventSchema,
  type ComponentData,
} from '../schemas/v2/webhook/ufabc-parser.js';

const studentSyncedDataSchema = StudentSyncedEventSchema.shape.data;
const studentFailedDataSchema = StudentFailedEventSchema.shape.data;

export const studentSyncProcessingJob = defineJob(
  JOB_NAMES.STUDENT_SYNC_PROCESSING
)
  .input(
    z.object({
      deliveryId: z.string().uuid().describe('Unique webhook delivery ID'),
      event: z
        .enum(['student.synced', 'student.failed'])
        .describe('Event type'),
      timestamp: z.string().describe('Event timestamp'),
      data: z.union([studentSyncedDataSchema, studentFailedDataSchema]),
    })
  )
  .handler(async ({ job, app }) => {
    const { deliveryId, event, data } = job.data;
    const db = app.db;

    const idempotencyKey = `${data.ra}-${deliveryId}`;
    let processingJob = await db.HistoryProcessingJob.findOne({
      idempotencyKey,
    });

    if (!processingJob) {
      processingJob = await db.HistoryProcessingJob.create({
        ra: data.ra,
        idempotencyKey,
        payload: data,
        source: 'webhook',
      });

      app.log.info(
        { deliveryId, jobId: processingJob._id.toString() },
        'Created history processing job'
      );
    }

    if (event === 'student.synced') {
      return handleStudentSynced(
        app,
        processingJob,
        deliveryId,
        data as z.infer<typeof StudentSyncedEventSchema>['data']
      );
    }

    if (event === 'student.failed') {
      return handleStudentFailed(
        app,
        processingJob,
        deliveryId,
        data as z.infer<typeof StudentFailedEventSchema>['data']
      );
    }

    return {
      success: false,
      event,
      message: 'Unknown event type',
    };
  });

async function handleStudentSynced(
  app: any,
  processingJob: any,
  deliveryId: string,
  data: z.infer<typeof StudentSyncedEventSchema>['data']
) {
  const db = app.db;

  app.log.info(
    {
      deliveryId,
      ra: data.ra,
      studentName: data.student.name,
      course: data.student.course,
      componentsCount: data.components.length,
    },
    'Student sync completed successfully'
  );

  const season = currentQuad();

  await processingJob.transition('processing', {
    source: 'webhook',
    note: 'Processing student data',
  });

  const studentSync = await db.StudentSync.findOne({ ra: data.ra });
  if (studentSync) {
    await studentSync.transition('processing', {
      source: 'webhook',
      note: 'Processing student data from webhook',
    });
  }

  await upsertStudentRecord(data, season);
  await createHistoryRecord(data);

  await processingJob.transition('completed', {
    note: 'Student history processed successfully',
  });

  if (studentSync) {
    await studentSync.transition('completed', {
      source: 'webhook',
      note: 'Student data processed successfully',
    });
  }

  await app.manager.dispatch(JOB_NAMES.PROCESS_COMPONENTS_ENROLLMENTS, {
    ra: Number(data.ra),
    historyJobId: processingJob._id.toString(),
    component: data.components,
    coefficients: data.coefficients,
  });

  app.log.info(
    {
      deliveryId,
      ra: data.ra,
      jobId: processingJob._id.toString(),
    },
    'Student history processed and saved'
  );

  return {
    success: true,
    deliveryId,
    event: 'student.synced',
    jobId: processingJob._id.toString(),
    processedAt: new Date().toISOString(),
  };
}

async function handleStudentFailed(
  app: any,
  processingJob: any,
  deliveryId: string,
  data: z.infer<typeof StudentFailedEventSchema>['data']
) {
  const db = app.db;

  app.log.error(
    {
      deliveryId,
      ra: data.ra,
      error: data.error,
    },
    'Student sync failed'
  );

  await processingJob.markFailed(
    {
      code: data.error.code,
      message: data.error.description,
      details: data.error.additionalData || null,
    },
    { source: 'webhook' }
  );

  const studentSync = await db.StudentSync.findOne({ ra: data.ra });
  if (studentSync) {
    await studentSync.markFailed(data.error.description, {
      source: 'webhook',
      errorCode: data.error.code,
      errorDetails: data.error.additionalData,
    });
  }

  return {
    success: true,
    deliveryId,
    event: 'student.failed',
    jobId: processingJob._id.toString(),
    processedAt: new Date().toISOString(),
  };
}

async function upsertStudentRecord(
  data: z.infer<typeof StudentSyncedEventSchema>['data'],
  season: string
) {
  const { student, coefficients, ra } = data;
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
      login: ra,
      $push: { cursos: courseData },
    },
    { upsert: true }
  );
}

async function createHistoryRecord(
  data: z.infer<typeof StudentSyncedEventSchema>['data']
) {
  const { coefficients, components, student, ra } = data;
  const { year: currentYear, quad: currentQuad } = findQuarter();

  const currentQuarterCoefficients = {
    ca_quad: coefficients.ca || 0,
    ca_acumulado: coefficients.ca || 0,
    cr_quad: coefficients.cr || 0,
    cr_acumulado: coefficients.cr || 0,
    cp_acumulado: coefficients.cp || 0,
    percentage_approved: 0,
    accumulated_credits: 0,
    period_credits: 0,
  };

  const baseUpdate = {
    $set: {
      ra: Number(ra),
      curso: student.course.toLowerCase(),
      grade: student.campus,
      disciplinas: components.map(transformComponentToHistory),
      [`coefficients.${currentYear}.${currentQuad}`]:
        currentQuarterCoefficients,
    },
  };

  await Promise.all([
    HistoryModel.findOneAndUpdate({ ra: Number(ra) }, baseUpdate, {
      upsert: true,
    }),
    GraduationHistoryModel.findOneAndUpdate(
      {
        ra: Number(ra),
        curso: student.course.toLowerCase(),
        grade: student.campus,
      },
      baseUpdate,
      { upsert: true }
    ),
  ]);
}

function transformComponentToHistory(component: ComponentData) {
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
