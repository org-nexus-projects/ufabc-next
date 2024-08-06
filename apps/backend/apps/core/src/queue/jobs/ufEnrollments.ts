import {
  batchInsertItems,
  currentQuad,
  parseResponseToJson,
} from '@next/common';
import { ofetch } from 'ofetch';
import { DisciplinaModel } from '@/models/Disciplina.js';

type SyncMatriculasParams = {
  operation: 'alunos_matriculados';
};
export type UFEnrollment = Record<string, number[]>;
type Enrollment = Record<number, number[]>;

export async function ufEnrollmentsJob(params: SyncMatriculasParams) {
  const season = currentQuad();
  const matriculas = await ofetch(
    'https://matricula.ufabc.edu.br/cache/matriculas.js',
    {
      parseResponse: parseResponseToJson,
    },
  );

  const enrollments = parseUFEnrollment(matriculas);

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

export function parseUFEnrollment(UFEnrollment: UFEnrollment): Enrollment {
  const enrollments: Record<number, number[]> = {};
  for (const rawStudentId in UFEnrollment) {
    const UFUserId = Number(rawStudentId);
    const studentEnrollments = UFEnrollment[UFUserId];

    if (!studentEnrollments) {
      continue;
    }

    for (const rawComponentId of studentEnrollments) {
      const componentId = Number(rawComponentId);
      enrollments[componentId] = (enrollments[componentId] || []).concat([
        UFUserId,
      ]);
    }
  }
  return enrollments;
}
