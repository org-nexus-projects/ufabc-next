import { currentQuad, findQuarter } from '@next/common';
import { defineJob } from '@next/queues/client';
import { z } from 'zod';

import { JOB_NAMES, PARSER_WEBHOOK_SUPPORTED_EVENTS } from '@/constants.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { HistoryModel } from '@/models/History.js';
import { StudentModel, type StudentCourse } from '@/models/Student.js';

import {
  StudentFailedEventSchema,
  StudentSyncedEventSchema,
  type ComponentData,
} from '../schemas/v2/webhook/ufabc-parser.js';

const webhookJobSchema = z.object({
  deliveryId: z.string().uuid().describe('Unique webhook delivery ID'),
  event: z.enum(PARSER_WEBHOOK_SUPPORTED_EVENTS).describe('Event type'),
  timestamp: z.string().describe('Event timestamp'),
  data: z.union([
    StudentSyncedEventSchema.shape.data,
    StudentFailedEventSchema.shape.data,
  ]),
});

export const ufabcParserWebhookProcessingJob = defineJob(
  JOB_NAMES.UFABC_PARSER_WEBHOOK_PROCESSING
)
  .input(webhookJobSchema)
  .handler(async ({ job, app }) => {
    const { deliveryId, event, data } = job.data;
    const db = app.db;

    app.log.info(
      {
        deliveryId,
        event,
        ra: data.ra,
      },
      'Processing UFABC Parser webhook'
    );

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

    try {
      if (event === 'student.synced') {
        const syncedData = data as z.infer<
          typeof StudentSyncedEventSchema
        >['data'];

        app.log.info(
          {
            deliveryId,
            ra: syncedData.ra,
            studentName: syncedData.student.name,
            course: syncedData.student.course,
            componentsCount: syncedData.components.length,
          },
          'Student sync completed successfully'
        );

        const season = currentQuad();

        await processingJob.transition('processing', {
          source: 'webhook',
          note: 'Processing student data',
        });

        const studentSync = await db.StudentSync.findOne({ ra: syncedData.ra });
        if (studentSync) {
          await studentSync.transition('processing', {
            source: 'webhook',
            note: 'Processing student data from webhook',
          });
        }

        await upsertStudentRecord(syncedData, season);
        await createHistoryRecord(syncedData);

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
          ra: Number(syncedData.ra),
          historyJobId: processingJob._id.toString(),
          component: syncedData.components,
          coefficients: syncedData.coefficients,
        });

        app.log.info(
          {
            deliveryId,
            ra: syncedData.ra,
            jobId: processingJob._id.toString(),
          },
          'Student history processed and saved'
        );
      } else if (event === 'student.failed') {
        const failedData = data as z.infer<
          typeof StudentFailedEventSchema
        >['data'];

        app.log.error(
          {
            deliveryId,
            ra: failedData.ra,
            errorCode: failedData.error.code,
            errorTitle: failedData.error.title,
            errorDescription: failedData.error.description,
            hasPartialData: !!failedData.partialData,
          },
          'Student sync failed'
        );

        await processingJob.markFailed(
          {
            code: failedData.error.code,
            message: failedData.error.description,
            details: failedData.error.additionalData || null,
          },
          { source: 'webhook' }
        );

        const studentSync = await db.StudentSync.findOne({ ra: failedData.ra });
        if (studentSync) {
          await studentSync.markFailed(failedData.error.description, {
            source: 'webhook',
            errorCode: failedData.error.code,
            errorDetails: failedData.error.additionalData,
          });
        }
      }

      return {
        success: true,
        deliveryId,
        event,
        jobId: processingJob._id.toString(),
        processedAt: new Date().toISOString(),
      };
    } catch (processingError: any) {
      app.log.error(
        {
          deliveryId,
          event,
          ra: data.ra,
          error: processingError,
          attemptsMade: job.attemptsMade,
        },
        'Failed to process webhook'
      );

      await processingJob.markFailed(
        {
          code: 'PROCESSING_ERROR',
          message: processingError.message,
          details: { stack: processingError.stack },
        },
        { source: 'webhook' }
      );

      const studentSync = await db.StudentSync.findOne({ ra: data.ra });
      if (studentSync) {
        await studentSync.markFailed(processingError.message, {
          source: 'webhook',
          errorCode: 'PROCESSING_ERROR',
        });
      }

      throw processingError;
    }
  });

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
