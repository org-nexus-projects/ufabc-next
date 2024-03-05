// import { courseId, type currentQuad, logger } from '@next/common';
// import { type Disciplina, DisciplinaModel } from '@/models/Disciplina.js';
// import { StudentModel } from '@/models/Student.js';
// import type { FilterQuery } from 'mongoose';
// import type { FastifyReply, FastifyRequest } from 'fastify';

import type { FastifyReply, FastifyRequest } from 'fastify';

// type DisciplinasStatsRequest = {
//   Querystring: {
//     season: ReturnType<typeof currentQuad>;
//     turno: Disciplina['turno'];
//     curso_id: string;
//     ratio: string;
//     limit: number;
//     page: string;
//   };
//   Params: {
//     action: 'overview' | 'disciplines' | 'courses';
//   };
// };

// export async function getDisciplinasStats(
//   request: FastifyRequest<DisciplinasStatsRequest>,
//   reply: FastifyReply,
// ) {
//   const { turno, season, curso_id, limit, page, ratio } = Object.assign(
//     request.query,
//     {
//       limit: 10,
//       page: 0,
//     },
//   );
//   const { action } = request.params;

//   const matchQuery: FilterQuery<Disciplina> = {};

//   if (turno) {
//     matchQuery.turno = turno;
//   }

//   if (curso_id) {
//     const interIds = [
//       await courseId(
//         'Bacharelado em Ciência e Tecnologia',
//         season,
//         StudentModel,
//       ),
//       await courseId(
//         'Bacharelado em Ciências e Humanidades',
//         season,
//         StudentModel,
//       ),
//     ];

//     matchQuery.obrigatorias = {
//       $in: [Number.parseInt(curso_id)],
//     };

//     // if passed course is not a BI, take BIs off query
//     if (!interIds.includes(Number.parseInt(curso_id))) {
//       matchQuery.obrigatorias.$nin = interIds;
//     }
//   }

//   // check if we are dealing with previous data or current
//   const isPrevious = await DisciplinaModel.find({ season }).countDocuments({
//     before_kick: {
//       $exists: true,
//       $ne: [],
//     },
//   });

//   const dataKey = isPrevious ? '$before_kick' : '$alunos_matriculados';

//   request.log.warn(request.query);

//   const disciplinasStats = await DisciplinaModel.aggregate([
//     {
//       $match: matchQuery,
//     },
//     {
//       $project: {
//         vagas: 1,
//         turno: 1,
//         codigo: 1,
//         disciplina: 1,
//         obrigatorias: 1,
//         turma: 1,
//         requisicoes: { $size: { $ifNull: [dataKey, []] } },
//       },
//     },
//     { $match: { vagas: { $gt: 0 } } },
//     {
//       $project: {
//         vagas: 1,
//         turno: 1,
//         codigo: 1,
//         disciplina: 1,
//         obrigatorias: 1,
//         requisicoes: 1,
//         turma: 1,
//         deficit: { $subtract: ['$requisicoes', '$vagas'] },
//         ratio: { $divide: ['$requisicoes', '$vagas'] },
//       },
//     },
//     ...isRatio(ratio),
//     ...resolveSteps(action, turno, curso_id),
//     {
//       $facet: {
//         total: [{ $count: 'total' }],
//         data: [
//           { $sort: { [ratio !== null ? 'ratio' : 'deficit']: -1 } },
//           { $limit: limit },
//           {
//             $project: {
//               codigo: 1,
//               disciplina: 1,
//               turma: 1,
//               turno: 1,
//               vagas: 1,
//               requisicoes: 1,
//               deficit: 1,
//               ratio: 1,
//             },
//           },
//         ],
//       },
//     },
//     {
//       $addFields: {
//         total: { $ifNull: [{ $arrayElemAt: ['$total.total', 0] }, 0] },
//         page,
//       },
//     },
//     {
//       $project: {
//         total: 1,
//         data: 1,
//         page: 1,
//       },
//     },
//   ]);
//   request.log.info(disciplinasStats);
//   return reply.status(200).send(disciplinasStats[0]);
// }

// const isRatio = (ratio: string) => {
//   return ratio != null
//     ? [{ $match: { ratio: { $gt: Number.parseFloat(ratio) } } }]
//     : [];
// };
// const overviewSteps = () => {
//   return [
//     {
//       $group: {
//         _id: null,
//         vagas: { $sum: '$vagas' },
//         requisicoes: { $sum: '$requisicoes' },
//         deficit: { $sum: '$deficit' },
//       },
//     },
//   ];
// };

// const disciplinaSteps = () => {
//   return [
//     {
//       $group: {
//         _id: '$codigo',
//         disciplina: { $first: '$disciplina' },
//         vagas: { $sum: '$vagas' },
//         requisicoes: { $sum: '$requisicoes' },
//       },
//     },
//     {
//       $project: {
//         disciplina: 1,
//         vagas: 1,
//         requisicoes: 1,
//         codigo: 1,
//         deficit: { $subtract: ['$requisicoes', '$vagas'] },
//         ratio: { $divide: ['$requisicoes', '$vagas'] },
//       },
//     },
//   ];
// };

// const courseSteps = (turno: Disciplina['turno'], curso_id: string) => {
//   const match: FilterQuery<Disciplina> = {};
//   if (turno) {
//     match.turno = turno;
//   }
//   if (curso_id) {
//     match.obrigatorias = Number.parseInt(curso_id);
//   }

//   return [
//     { $unwind: '$obrigatorias' },
//     { $match: match },
//     {
//       $group: {
//         _id: '$obrigatorias',
//         obrigatorias: { $first: '$obrigatorias' },
//         disciplina: { $first: '$disciplina' },
//         vagas: { $sum: '$vagas' },
//         requisicoes: { $sum: '$requisicoes' },
//       },
//     },
//     {
//       $project: {
//         vagas: 1,
//         requisicoes: 1,
//         deficit: { $subtract: ['$requisicoes', '$vagas'] },
//         ratio: { $divide: ['$requisicoes', '$vagas'] },
//       },
//     },
//   ];
// };

// const resolveSteps = (
//   action: 'overview' | 'disciplines' | 'courses',
//   ...args: any[]
// ) => {
//   const fn =
//     {
//       overview: overviewSteps,
//       disciplines: disciplinaSteps,
//       courses: courseSteps,
//     }[action] ||
//     function () {
//       return [];
//     };

//   // @ts-expect-error for now
//   return fn(...args);
// };

// uncomment once i know what is happening
// eslint-disable-next-line require-await
export async function getDisciplinasStats(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  console.log('uncomment once i know what to do', request, reply);
}
