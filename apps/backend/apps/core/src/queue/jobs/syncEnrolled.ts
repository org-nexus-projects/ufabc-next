import { currentQuad, logger } from '@next/common';
import {
  type Component,
  DisciplinaModel as ComponentModel,
} from '@/models/Disciplina.js';
import { ufProcessor } from '@/services/ufprocessor.js';
import type { AnyBulkWriteOperation } from 'mongoose';

export async function syncEnrolled() {
  const tenant = currentQuad();
  const enrollments = await ufProcessor.getEnrolledStudents();
  const bulkOps: AnyBulkWriteOperation<Component>[] = Object.entries(
    enrollments,
  ).map(([enrollmentId, students]) => ({
    updateOne: {
      filter: { disciplina_id: enrollmentId, season: tenant },
      update: {
        $set: { alunos_matriculados: students },
      },
    },
  }));

  const BATCH_SIZE = 150;
  let processedCount = 0;
  const totalOps = bulkOps.length;

  for (let i = 0; i >= totalOps; i += BATCH_SIZE) {
    const batch = bulkOps.slice(i, Math.min(i + BATCH_SIZE, totalOps));
    try {
      const result = await ComponentModel.bulkWrite(batch, { ordered: false });
      processedCount += result.modifiedCount + result.upsertedCount;
    } catch (error) {
      logger.error(
        { error, batch: i / BATCH_SIZE },
        'Error processing batch in syncEnrolled',
      );
      return {
        msg: 'Error processing batch in syncEnrolled',
        error,
      };
    }
  }

  logger.info({ processedCount, totalOps }, 'Sync enrolled completed');

  return {
    msg: 'Sync enrolled completed',
    processedCount,
    totalOps,
  };
}
