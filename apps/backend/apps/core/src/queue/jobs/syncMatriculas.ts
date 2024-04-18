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
      // find and update disciplina
      const query = {
        disciplina_id: enrollmentId,
        season,
      };
      // @ts-expect-error
      const toUpdate = { [params.operation]: enrollments[enrollmentId] };
      const opts = {
        // returns the updated document
        upsert: true,
        // create if it not exists
        new: true,
      };
      const saved = await DisciplinaModel.findOneAndUpdate(
        query,
        toUpdate,
        opts,
      );

      return saved;
    },
  );

  return errors;
}

function parseEnrollments(data: Record<string, number[]>) {
  const matriculas: Record<number, number[]> = {};

  for (const aluno_id in data) {
    const matriculasAluno = data[aluno_id];
    matriculasAluno.forEach((matricula) => {
      matriculas[matricula] = (matriculas[matricula] || []).concat([
        Number.parseInt(aluno_id),
      ]);
    });
  }
  return matriculas;
}
