import { currentQuad, logger } from '@next/common';
import { type Component, ComponentModel } from '@/models/Component.js';
import { ufProcessor } from '@/services/ufprocessor.js';
import type { AnyBulkWriteOperation } from 'mongoose';

export async function syncEnrolled() {
  const tenant = currentQuad();
  const enrollments = await ufProcessor.getEnrolledStudents();
  const bulkOps: AnyBulkWriteOperation<Component>[] = Object.entries(
    enrollments,
  ).map(([enrollmentId, students]) => ({
    updateOne: {
      filter: { disciplina_id: Number(enrollmentId), season: tenant },
      update: {
        $set: { alunos_matriculados: students },
      },
    },
  }));

  if (bulkOps.length > 0) {
    const result = await ComponentModel.bulkWrite(bulkOps);
    logger.info({
      msg: 'components enrolled updated',
      modifiedCount: result.modifiedCount,
    });

    return {
      msg: 'components enrolled updated',
      modifiedCount: result.modifiedCount,
    };
  }

  logger.info('No components needed updating or creation');
  return {
    msg: 'No changes needed',
    modifiedCount: 0,
    insertedCount: 0,
    upsertedCount: 0,
  };
}
