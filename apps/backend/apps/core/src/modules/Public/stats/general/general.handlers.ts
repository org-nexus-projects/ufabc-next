import { CommentModel } from '@/models/Comment.js';
import { DisciplinaModel } from '@/models/Disciplina.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import { StudentModel } from '@/models/Student.js';
import { UserModel } from '@/models/User.js';
import type { currentQuad } from '@next/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

type Season = ReturnType<typeof currentQuad>;

export class GeneralStatsHandler {
  async generalStats(
    request: FastifyRequest<{ Querystring: { season: Season } }>,
    reply: FastifyReply,
  ) {
    const { season } = request.query;
    if (!season) {
      return reply.badRequest('Missing season');
    }

    const teacherCountQuery = [
      {
        $group: {
          _id: null,
          teoria: { $addToSet: '$teoria' },
          pratica: { $addToSet: '$pratica' },
        },
      },
      {
        $project: { teachers: { $setUnion: ['$teoria', '$pratica'] } },
      },
      { $unwind: { path: '$teachers', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, total: { $sum: 1 } } },
      { $project: { _id: 0 } },
    ];

    const subjectsCountQuery = [
      { $group: { _id: null, total: { $sum: 1 } } },
      { $project: { _id: 0 } },
    ];

    // check if we are dealing with previous data or current
    const isPrevious = await DisciplinaModel.countDocuments({
      season,
      before_kick: { $exists: true, $ne: [] },
    });

    const dataKey = isPrevious ? '$before_kick' : '$alunos_matriculados';
    const studentCount = [
      {
        $unwind: dataKey,
      },
      { $group: { _id: null, alunos: { $addToSet: dataKey } } },
      { $unwind: '$alunos' },
      { $group: { _id: null, total: { $sum: 1 } } },
    ];

    const [disciplinasStats] = await DisciplinaModel.aggregate([
      {
        $facet: {
          teachers: teacherCountQuery,
          totalAlunos: studentCount,
          subjects: subjectsCountQuery,
        },
      },
      {
        $addFields: {
          teachers: { $ifNull: [{ $arrayElemAt: ['$teachers.total', 0] }, 0] },
          totalAlunos: {
            $ifNull: [{ $arrayElemAt: ['$totalAlunos.total', 0] }, 0],
          },
          subjects: { $ifNull: [{ $arrayElemAt: ['$subjects.total', 0] }, 0] },
        },
      },
    ]);

    const generalStatsCount = {
      users: await UserModel.countDocuments({}),
      currentAlunos: await StudentModel.countDocuments({}),
      comments: await CommentModel.countDocuments({}),
      enrollments: await EnrollmentModel.countDocuments({
        conceito: { $in: ['A', 'B', 'C', 'D', 'O', 'F'] },
      }),
    };

    return Object.assign({}, disciplinasStats, generalStatsCount);
  }
}
