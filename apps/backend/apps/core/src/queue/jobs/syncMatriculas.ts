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

export async function syncMatriculasJob(params: SyncMatriculasParams) {
  const season = currentQuad();
  const matriculas = await ofetch(
    'https://matricula.ufabc.edu.br/cache/matriculas.js',
    {
      parseResponse: parseResponseToJson,
    },
  );
  const enrollments = parseEnrollments(matriculas);
  const errors = await batchInsertItems(
    Object.keys(enrollments),
    async (enrollmentId) => {
      const updatedDisciplinaDocument = await DisciplinaModel.findOneAndUpdate(
        { disciplina_id: enrollmentId, season },
        {$set: { [params.operation]: enrollments[Number.parseInt(enrollmentId)] }},
        { upsert: true, new: true },
      );

      return updatedDisciplinaDocument;
    },
  );

  return errors;
}

function parseEnrollments(rawEnrollments: Record<string, number[]>) {
  const enrollments: Record<number, number[]> = {};
  for (const studentId in rawEnrollments) {
    const studentEnrollments = rawEnrollments[studentId];
    studentEnrollments.forEach((enrollment) => {
      enrollments[enrollment] = (enrollments[enrollment] || []).concat([
        Number.parseInt(studentId),
      ]);
    });
  }
  return enrollments;
}
