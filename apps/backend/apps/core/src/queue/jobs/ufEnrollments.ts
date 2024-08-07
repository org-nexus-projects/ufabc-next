import { batchInsertItems, currentQuad, logger } from '@next/common';
import { DisciplinaModel } from '@/models/Disciplina.js';
import { ufProcessor } from '@/services/ufprocessor.js';

type SyncMatriculasParams = {
  operation: 'alunos_matriculados';
};

export async function ufEnrollmentsJob(params: SyncMatriculasParams) {
  const season = currentQuad();
  const enrollments = await ufProcessor.getEnrolledStudents();
  const bulkOps = Object.entries(enrollments).map(
    ([enrollmentId, students]) => ({
      updateOne: {
        filter: { disciplina_id: enrollmentId, season },
        update: { $set: { [params.operation]: students } },
        upsert: true,
      },
    }),
  );

  const BATCH_SIZE = 150;
  const errors = await batchInsertItems(
    Array.from({ length: Math.ceil(bulkOps.length / BATCH_SIZE) }, (_, i) =>
      bulkOps.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE),
    ),
    async (batch) => {
      await DisciplinaModel.bulkWrite(batch, { ordered: false });
    },
  );

  return errors;
}
