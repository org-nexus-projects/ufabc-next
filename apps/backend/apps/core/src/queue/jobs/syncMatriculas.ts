import { currentQuad, logger } from '@next/common';
import { ofetch } from 'ofetch';
// import { Redis } from 'ioredis';
// import { Config } from '@/config/config.js';
import { createQueue } from '../utils/queue.js';
import { batchInsertItems } from '../utils/batch-insert.js';
import type { DisciplinaModel } from '@/models/index.js';
import type { Job, JobsOptions } from 'bullmq';
import type { ObjectId } from 'mongoose';

type SyncParams = {
  operation: 'alunos_matriculados' | 'before_kick' | 'after_kick' | '';
  disciplinaModel: typeof DisciplinaModel;
};

type SyncDisciplinas = {
  _id: ObjectId;
  disciplina_id: number;
  season: string;
  after_kick: number[];
  alunos_matriculados: number[];
  before_kick: number[];
  createdAt: Date;
  obrigatorias: number[];
  quad: 1 | 2 | 3;
  updatedAt: Date;
  year: number;
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
  const matriculas: Record<string, number[]> = {};

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
  disciplinaModel: typeof DisciplinaModel,
) {
  const season = currentQuad();
  const operationMap = new Map([
    ['before_kick', 'before_kick'],
    ['after_kick', 'after_kick'],
    ['sync', 'alunos_matriculados'],
  ]);

  const operationField = operationMap.get(operation) ?? 'alunos_matriculados';
  const isSync = operationField === 'alunos_matriculados';

  const matriculas = await ofetch(
    'https://api.ufabcnext.com/snapshot/assets/matriculas.js',
    {
      parseResponse: valueToJson,
    },
  );

  const enrollments = parseEnrollments(matriculas);

  //maybe we should use a redis connection pool
  //or anything more thought out and performant
  //but for now this will do
  //TODO: find a bulletproof way to handle redis connections
  // so we don't have to create a new connection every time
  // const redis = new Redis({
  //   username: Config.REDIS_USER,
  //   password: Config.REDIS_PASSWORD,
  //   host: Config.REDIS_HOST,
  //   port: Config.REDIS_PORT,
  // });

  const updateEnrolledStudents = async (
    enrollmentId: string,
    payload: Record<string, number[]>,
  ): Promise<'OK' | SyncDisciplinas | null> => {
    const cacheKey = `disciplina_${season}_${enrollmentId}`;
    // only get cache result if we are doing a sync operation
    // const cachedMatriculas = isSync ? await redis.get(cacheKey) : {};
    const cachedMatriculas = {};
    const isPayloadEqual =
      JSON.stringify(cachedMatriculas) ===
      JSON.stringify(payload[enrollmentId]);
    // only update disciplinas that matriculas has changed
    if (isPayloadEqual) {
      return cachedMatriculas as SyncDisciplinas;
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
    const saved = await disciplinaModel.findOneAndUpdate<SyncDisciplinas>(
      query,
      toUpdate,
      opts,
    );
    // save matriculas for this disciplina on cache if is sync operation
    if (isSync) {
      // await redis.set(
      //   cacheKey,
      //   JSON.stringify(payload[enrollmentId]),
      //   'EX',
      //   60 * 2,
      //   'NX',
      // );

      await disciplinaModel.findOneAndUpdate(
        {
          disciplina_id: enrollmentId,
          season,
        },
        { [operationField]: payload[enrollmentId] },
        { upsert: true, new: true },
      );
    }

    return saved;
  };

  const start = Date.now();

  const errors = await batchInsertItems(
    Object.keys(enrollments),
    async (enrollmentId: string): Promise<any> => {
      const updatedStudents = await updateEnrolledStudents(
        enrollmentId,
        enrollments,
      );
      return updatedStudents;
    },
  );

  // await redis.quit();

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
    logger.info('[QUEUE] start sync matriculas');
    const { operation, disciplinaModel } = job.data;
    await syncMatriculas(operation, disciplinaModel);
  } catch (error) {
    logger.error({ error }, 'SyncWorker: Error Syncing');
    throw error;
  }
};
