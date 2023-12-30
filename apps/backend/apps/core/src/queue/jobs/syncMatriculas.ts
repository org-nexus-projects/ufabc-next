import { currentQuad, logger } from '@next/common';
import { ofetch } from 'ofetch';
import { DisciplinaModel } from '@/models/index.js';
import { createQueue } from '../utils/queue.js';
import { batchInsertItems } from '../utils/batch-insert.js';
import type { FastifyRedis } from '@fastify/redis';
import type { Job, JobsOptions } from 'bullmq';

type SyncParams = {
  operation: 'alunos_matriculados' | 'before_kick' | 'after_kick' | '';
  redis: FastifyRedis;
};

const valueToJson = (payload: string, max?: number) => {
  const parts = payload.split('=');
  if (parts.length < 2) {
    return [];
  }

  const jsonStr = parts[1].split(';')[0];
  const json = JSON.parse(jsonStr) as number[];
  if (max) {
    return json.slice(0, max);
  }
  return json;
};

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

//this function encapsulate the logic to sync stuff from matriculas
//so it can be used by the queue and by the route
export async function syncMatriculas(
  operation: string = '',
  redis?: FastifyRedis,
) {
  const season = currentQuad();
  const operationMap = new Map([
    ['before_kick', 'before_kick'],
    ['after_kick', 'after_kick'],
    ['sync', 'alunos_matriculados'],
  ]);
  const operationField = operationMap.get(operation) || 'alunos_matriculados';

  const isSync = operationField === 'alunos_matriculados';

  const matriculas = await ofetch(
    'https://matricula.ufabc.edu.br/cache/matriculas.js',
    {
      parseResponse: valueToJson,
    },
  );
  const enrollments = parseEnrollments(matriculas);

  const updateEnrolledStudents = async (
    enrollmentId: number,
    payload: typeof enrollments,
  ) => {
    const cacheKey = `disciplina_${season}_${enrollmentId}`;
    // only get cache result if we are doing a sync operation
    const cachedMatriculas = isSync ? await redis?.get(cacheKey) : {};
    const isPayloadEqual =
      JSON.stringify(cachedMatriculas) ===
      JSON.stringify(payload[enrollmentId]);

    // only update disciplinas that matriculas has changed
    if (isPayloadEqual) {
      return cachedMatriculas;
    }

    // find and update disciplina
    const query = {
      disciplina_id: enrollmentId,
      season,
    };
    const toUpdate = { [operationField]: payload[enrollmentId] };
    const opts = {
      // returns the updated document
      upsert: true,
      // create if it not exists
      new: true,
    };
    const saved = await DisciplinaModel.findOneAndUpdate(query, toUpdate, opts);
    // save matriculas for this disciplina on cache if is sync operation
    // eslint-disable-next-line no-unused-expressions
    isSync
      ? await redis?.set(cacheKey, JSON.stringify(payload[enrollmentId]))
      : null;

    return saved;
  };

  const start = Date.now();
  const errors = await batchInsertItems(
    Object.keys(enrollments),
    async (enrollmentId): Promise<any> => {
      const updatedStudents = await updateEnrolledStudents(
        enrollmentId as unknown as number,
        enrollments,
      );
      return updatedStudents;
    },
  );

  redis?.quit();

  return {
    status: 'Sync has been successfully',
    duration: Date.now() - start,
    errors,
  };
}

export const syncQueue = createQueue('Sync:Matriculas');

export const addSyncToQueue = async (payload: SyncParams) => {
  const TWO_MINUTES = 1_000 * 120;
  const opts = {
    repeat: {
      every: TWO_MINUTES,
    },
  } satisfies JobsOptions;
  await syncQueue.add('Sync:Matriculas', payload, opts);
};

export const syncWorker = async (job: Job<SyncParams>) => {
  try {
    const { operation } = job.data;
    await syncMatriculas(operation);
  } catch (error) {
    logger.error({ error }, 'SyncWorker: Error Syncing');
    throw error;
  }
};
