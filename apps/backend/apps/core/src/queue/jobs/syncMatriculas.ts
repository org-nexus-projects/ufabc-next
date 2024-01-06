// import { currentQuad, logger } from '@next/common';
// import { ofetch } from 'ofetch';
// import { isEqual } from 'lodash-es';
// import { DisciplinaModel } from '@/models/index.js';
// import { createQueue } from '../utils/queue.js';
// import { batchInsertItems } from '../utils/batch-insert.js';
// import type { FastifyRedis } from '@fastify/redis';
// import type { Job, JobsOptions } from 'bullmq';

// type SyncParams = {
//   operation: 'alunos_matriculados' | 'before_kick' | 'after_kick' | '';
//   redis: FastifyRedis;
// };

// const valueToJson = (payload: string, max?: number) => {
//   const parts = payload.split('=');
//   if (parts.length < 2) {
//     return [];
//   }

//   const jsonStr = parts[1].split(';')[0];
//   const json = JSON.parse(jsonStr) as number[];
//   if (max) {
//     return json.slice(0, max);
//   }
//   return json;
// };

// const parseEnrollments = (data: Record<string, number[]>) => {
//   const matriculas: Record<number, number[]> = {};

//   for (const aluno_id in data) {
//     const matriculasAluno = data[aluno_id];
//     matriculasAluno.forEach((matricula) => {
//       matriculas[matricula] = (matriculas[matricula] || []).concat([
//         Number.parseInt(aluno_id),
//       ]);
//     });
//   }
//   return matriculas;
// };

// //this function encapsulate the logic to sync stuff from matriculas
// //so it can be used by the queue and by the route
// // Here the job that runs is only the sync job, so it dont make sense to cover other cases
// // it dont make sense to cache either, since everything is going to the redis server
// // the ideal behavior is to skip  `not cache` the already known data
// export async function syncMatriculasJob(redis?: FastifyRedis) {
//   const season = currentQuad();

//   const matriculas = await ofetch(
//     'https://matricula.ufabc.edu.br/cache/matriculas.js',
//     {
//       parseResponse: valueToJson,
//     },
//   );
//   const enrollments = parseEnrollments(matriculas);

//   await batchInsertItems(
//     Object.keys(enrollments),
//     async (enrollmentId): Promise<any> => {
//       const cacheKey = `disciplina_${season}_${enrollmentId}`;
//       // first time? cache it.
//       await redis?.set(cacheKey, JSON.stringify(enrollments[enrollmentId]));
//       const cachedMatriculas = (await redis?.get(cacheKey)) ?? {};

//       const isPayloadEqual = isEqual(
//         cachedMatriculas,
//         enrollments[enrollmentId],
//       );

//       if (isPayloadEqual) {
//         // nothing changed
//         return cachedMatriculas;
//       }
//       // find and update disciplina
//       const query = {
//         disciplina_id: enrollmentId,
//         season,
//       };
//       const toUpdate = { alunos_matriculados: enrollment[enrollmentId] };
//       const opts = {
//         // returns the updated document
//         upsert: true,
//         // create if it not exists
//         new: true,
//       };
//       const saved = await DisciplinaModel.findOneAndUpdate(
//         query,
//         toUpdate,
//         opts,
//       );

//       return saved;
//     },
//   );

//   redis?.quit();
// }

// export const syncQueue = createQueue('Sync:Matriculas');

// export const addSyncToQueue = async (payload: SyncParams) => {
//   const TWO_MINUTES = 1_000 * 120;
//   const opts = {
//     repeat: {
//       every: TWO_MINUTES,
//     },
//   } satisfies JobsOptions;
//   await syncQueue.add('Sync:Matriculas', payload, opts);
// };

// export const syncWorker = async (job: Job<SyncParams>) => {
//   try {
//     await syncMatriculasJob(operation);
//   } catch (error) {
//     logger.error({ error }, 'SyncWorker: Error Syncing');
//     throw error;
//   }
// };
