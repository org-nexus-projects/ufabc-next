import { ComponentModel } from '@/models/Component.js';
import type { currentQuad } from '@next/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

type Season = ReturnType<typeof currentQuad>;

export async function studentStats(
  request: FastifyRequest<{ Querystring: { season: Season } }>,
  reply: FastifyReply,
) {
  const { season } = request.query;
  if (!season) {
    return reply.badRequest('Missing season');
  }

  // check if we are dealing with previous data or current
  const isPrevious = await ComponentModel.countDocuments({
    season,
    before_kick: { $exists: true, $ne: [] },
  });
  const dataKey = isPrevious ? '$before_kick' : '$alunos_matriculados';

  const studentsStats = ComponentModel.aggregate([
    { $match: { season } },
    { $unwind: dataKey },
    { $group: { _id: dataKey, count: { $sum: 1 } } },
    { $group: { _id: '$count', students_number: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    {
      $project: {
        students_number: 1,
        components_number: '$_id',
      },
    },
  ]);

  return studentsStats;
}
