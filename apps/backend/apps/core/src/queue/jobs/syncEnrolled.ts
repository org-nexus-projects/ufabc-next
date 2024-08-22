import { batchInsertItems, currentQuad } from '@next/common';
import { DisciplinaModel as ComponentModel } from '@/models/Disciplina.js';
import { ufProcessor } from '@/services/ufprocessor.js';

export async function syncEnrolled() {
  const season = currentQuad();
  const enrollments = await ufProcessor.getEnrolledStudents();
  const bulkOps = Object.entries(enrollments).map(
    ([enrollmentId, students]) => ({
      updateOne: {
        filter: { disciplina_id: enrollmentId, season },
        update: {
          $set: { alunos_matriculados: students },
        },
      },
    }),
  );

  const BATCH_SIZE = 150;
  const errors = await batchInsertItems(
    Array.from({ length: Math.ceil(bulkOps.length / BATCH_SIZE) }, (_, i) =>
      bulkOps.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE),
    ),
    async (batch) => {
      await ComponentModel.bulkWrite(batch, { ordered: false });
    },
  );

  return errors;
}
