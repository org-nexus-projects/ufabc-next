import { defineJob } from '@next/queues/client';
import { z } from 'zod';
import { FastifyInstance } from 'fastify';

export const historyProcessingJob = defineJob('HISTORY_PROCESSING')
  .input(
    z.object({
      jobId: z.string().describe('Processing job ID'),
      webhookData: z.object({
        type: z.enum(['history', 'error']),
        payload: z.any(),
      }),
    })
  )
  .handler(async ({ job, app, manager }) => {
    const { jobId, webhookData } = job.data;
    const db = (app as FastifyInstance).db;

    await db.models.HistoryProcessingJob.findByIdAndUpdate(jobId, {
      status: 'processing',
      updatedAt: new Date(),
      $push: {
        timeline: {
          status: 'processing',
          timestamp: new Date(),
          note: 'Job started processing',
        },
      },
    });

    try {
      if (webhookData.type === 'error') {
        await handleErrorPayload(jobId, webhookData.payload, db);
      } else {
        await handleHistoryPayload(
          jobId,
          webhookData.payload,
          db,
          app as FastifyInstance
        );
      }

      await db.models.HistoryProcessingJob.findByIdAndUpdate(jobId, {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
        $push: {
          timeline: {
            status: 'completed',
            timestamp: new Date(),
            note: 'Job completed successfully',
          },
        },
      });
    } catch (processingError) {
      const errorInfo = categorizeError(processingError);

      await db.models.HistoryProcessingJob.findByIdAndUpdate(jobId, {
        status: 'failed',
        error: errorInfo,
        failedAt: new Date(),
        updatedAt: new Date(),
        $push: {
          timeline: {
            status: 'failed',
            timestamp: new Date(),
            note: `Job failed: ${errorInfo.message}`,
            details: errorInfo,
          },
        },
      });

      const maxRetries = getMaxRetriesForError(errorInfo.code);
      const retryDelay = calculateRetryDelay(job.attemptsMade);

      if (job.attemptsMade < maxRetries) {
        throw processingError;
      }

      job.log(
        `Job permanently failed after ${job.attemptsMade} attempts: ${errorInfo.message}`
      );
    }
  });

async function handleHistoryPayload(
  jobId: string,
  payload: any,
  db: any,
  app: FastifyInstance
) {
  const { ra, student, histories } = payload;

  await db.models.HistoryProcessingJob.findByIdAndUpdate(jobId, {
    $push: {
      timeline: {
        status: 'processing',
        timestamp: new Date(),
        note: 'Processing student data',
        details: { ra, studentName: student.name },
      },
    },
  });

  const existingStudent = await db.models.Student.findOne({ ra });

  if (existingStudent) {
    await db.models.Student.updateOne(
      { ra },
      {
        name: student.name,
        course: student.course,
        currentQuad: student.currentQuad,
        breakdown: student.breakdown,
      }
    );
  } else {
    await db.models.Student.create({
      ra,
      name: student.name,
      course: student.course,
      currentQuad: student.currentQuad,
      breakdown: student.breakdown,
    });
  }

  await db.models.HistoryProcessingJob.findByIdAndUpdate(jobId, {
    $push: {
      timeline: {
        status: 'processing',
        timestamp: new Date(),
        note: 'Processing history records',
        details: { historyCount: histories.length },
      },
    },
  });

  await db.models.History.deleteMany({ ra });

  const historyDocuments = histories.map((history: any) => ({
    ...history,
    ra,
  }));

  await db.models.History.insertMany(historyDocuments);

  await processEnrollmentsIfNeeded(jobId, ra, histories, db, app);
}

async function handleErrorPayload(jobId: string, payload: any, db: any) {
  const { ra, error, processing, partialData } = payload;

  await db.models.HistoryProcessingJob.findByIdAndUpdate(jobId, {
    $push: {
      timeline: {
        status: 'processing',
        timestamp: new Date(),
        note: 'Processing error webhook',
        details: { errorCode: error.code, errorMessage: error.message },
      },
    },
  });

  if (partialData?.student) {
    const existingStudent = await db.models.Student.findOne({ ra });

    if (existingStudent) {
      await db.models.Student.updateOne(
        { ra },
        {
          name: partialData.student.name,
          course: partialData.student.course,
        }
      );
    }
  }

  if (partialData?.histories && partialData.histories.length > 0) {
    const shouldFreezeProcessing = shouldFreezeForError(error.code);

    if (!shouldFreezeProcessing) {
      const historyDocuments = partialData.histories.map((history: any) => ({
        ...history,
        ra,
      }));

      await db.models.History.insertMany(historyDocuments);
    }
  }

  throw new Error(`Parser error: ${error.code} - ${error.message}`);
}

async function processEnrollmentsIfNeeded(
  jobId: string,
  ra: string,
  histories: any[],
  db: any,
  app: FastifyInstance
) {
  const currentQuad = getCurrentQuadFromDate();
  const currentHistories = histories.filter(
    (h: any) => h.year === currentQuad.year && h.quad === currentQuad.quad
  );

  if (currentHistories.length === 0) {
    return;
  }

  await db.models.HistoryProcessingJob.findByIdAndUpdate(jobId, {
    $push: {
      timeline: {
        status: 'processing',
        timestamp: new Date(),
        note: 'Processing current quad enrollments',
        details: { enrollmentCount: currentHistories.length },
      },
    },
  });

  const existingEnrollments = await db.models.Enrollment.find({
    ra,
    year: currentQuad.year,
    quad: currentQuad.quad,
  });

  const enrollmentsToCreate = currentHistories.filter(
    (history: any) =>
      !existingEnrollments.some(
        (enrollment) =>
          enrollment.subjectCode === history.code &&
          enrollment.class === history.className
      )
  );

  if (enrollmentsToCreate.length > 0) {
    const enrollmentDocuments = enrollmentsToCreate.map((history: any) => ({
      ra,
      subjectCode: history.code,
      year: currentQuad.year,
      quad: currentQuad.quad,
      class: history.className,
      status: mapHistoryStatusToEnrollment(history.status),
      createdAt: new Date(),
    }));

    await db.models.Enrollment.insertMany(enrollmentDocuments);
  }
}

function categorizeError(error: any): {
  code: string;
  message: string;
  type: string;
} {
  if (error.code === 'ValidationError') {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Invalid payload structure',
      type: 'INVALID_DATA',
    };
  }

  if (error.name === 'CastError') {
    return {
      code: 'DATA_TYPE_ERROR',
      message: 'Invalid data type in payload',
      type: 'INVALID_DATA',
    };
  }

  if (error.code === 11000) {
    return {
      code: 'DUPLICATE_DATA',
      message: 'Duplicate data detected',
      type: 'INVALID_DATA',
    };
  }

  if (
    error.message.includes('timeout') ||
    error.message.includes('ETIMEDOUT')
  ) {
    return {
      code: 'TIMEOUT',
      message: 'Processing timeout',
      type: 'TIMEOUT',
    };
  }

  if (
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('connection')
  ) {
    return {
      code: 'DATABASE_ERROR',
      message: 'Database connection error',
      type: 'SYSTEM_ERROR',
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'Unknown error occurred',
    type: 'SYSTEM_ERROR',
  };
}

function shouldFreezeForError(errorCode: string): boolean {
  const freezeErrors = [
    'STUDENT_NOT_FOUND',
    'INVALID_DATA',
    'VALIDATION_ERROR',
    'DATA_TYPE_ERROR',
  ];

  return freezeErrors.includes(errorCode);
}

function getMaxRetriesForError(errorCode: string): number {
  const retryLimits: Record<string, number> = {
    TIMEOUT: 5,
    DATABASE_ERROR: 3,
    SYSTEM_ERROR: 2,
    DUPLICATE_DATA: 1,
    VALIDATION_ERROR: 0,
    DATA_TYPE_ERROR: 0,
    STUDENT_NOT_FOUND: 0,
    INVALID_DATA: 0,
  };

  return retryLimits[errorCode] || 2;
}

function calculateRetryDelay(attemptsMade: number): number {
  return Math.min(1000 * Math.pow(2, attemptsMade), 60000);
}

function getCurrentQuadFromDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let quad: string;
  if (month >= 2 && month <= 5) {
    quad = '1';
  } else if (month >= 6 && month <= 9) {
    quad = '2';
  } else {
    quad = '3';
  }

  return { year, quad };
}

function mapHistoryStatusToEnrollment(historyStatus: string): string {
  const statusMapping: Record<string, string> = {
    Aprovado: 'approved',
    Matriculado: 'enrolled',
    Reprovado: 'failed',
    Trancado: 'dropped',
    Cancelado: 'cancelled',
  };

  return statusMapping[historyStatus] || 'unknown';
}
