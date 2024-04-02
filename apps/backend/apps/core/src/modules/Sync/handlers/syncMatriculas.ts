import {
  batchInsertItems,
  currentQuad,
  parseResponseToJson,
} from '@next/common';
import { ofetch } from 'ofetch';
import { isEqual } from 'lodash-es';
import { DisciplinaModel } from '@/models/Disciplina.js';
import type { FastifyRequest } from 'fastify';

export type SyncMatriculasRequest = {
  Querystring: {
    operation: 'alunos_matriculados' | 'after_kick' | 'before_kick';
  };
};

export async function syncMatriculasHandler(
  request: FastifyRequest<SyncMatriculasRequest>,
) {
  const season = currentQuad();
  const { redis } = request.server;
  const { operation } = request.query;
  const operationMap =
    new Map([
      ['before_kick', 'before_kick'],
      ['after_kick', 'after_kick'],
      ['sync', 'alunos_matriculados'],
    ]).get(operation) ?? 'alunos_matriculados';
  // check if we are doing a sync operation
  // update current enrolled students
  const isSyncMatriculas = operationMap === 'alunos_matriculados';
  const rawUfabcMatricula = await ofetch(
    'https://matricula.ufabc.edu.br/cache/matriculas.js',
    { parseResponse: parseResponseToJson },
  );

  const ufabcMatricula = parseEnrollments(rawUfabcMatricula);

  const start = Date.now();
  const errors = await batchInsertItems(
    Object.keys(ufabcMatricula),
    async (ufabcMatriculaIds) => {
      const cacheKey = `disciplina_${season}_${ufabcMatriculaIds}`;
      const cachedUfabcMatriculas = isSyncMatriculas
        ? await redis.get(cacheKey)
        : {};

      if (
        isEqual(
          cachedUfabcMatriculas,
          ufabcMatricula[Number(ufabcMatriculaIds)],
        )
      ) {
        return cachedUfabcMatriculas;
      }

      const updatedDisciplinas = await DisciplinaModel.findOneAndUpdate(
        {
          season,
          disciplina_id: ufabcMatriculaIds,
        },
        { [operationMap]: ufabcMatricula[Number(ufabcMatriculaIds)] },
        { upsert: true, new: true },
      );

      if (isSyncMatriculas) {
        await redis.set(
          cacheKey,
          JSON.stringify(ufabcMatricula[Number(ufabcMatriculaIds)]),
        );
      }
      return updatedDisciplinas;
    },
  );

  return {
    status: 'ok',
    time: Date.now() - start,
    errors,
  };
}

const parseEnrollments = (data: Record<string, number[]>) => {
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
};
