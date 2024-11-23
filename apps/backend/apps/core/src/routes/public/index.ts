import { CommentModel } from '@/models/Comment.js';
import { ComponentModel } from '@/models/Component.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import { GraduationModel } from '@/models/Graduation.js';
import { StudentModel } from '@/models/Student.js';
import { UserModel } from '@/models/User.js';
import {
  listGraduationsSchema,
  listStudentStats,
  type GraduationList,
} from '@/schemas/public.js';
import { currentQuad } from '@next/common';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { PipelineStage } from 'mongoose';

type ComponentsStats = {
  teachers: number;
  subjects: number;
  totalAlunos: number;
  studentTotal: Array<{ total: number; _id: null }>;
};

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const publicCache = app.cache();

  app.get('/summary', { logLevel: 'silent' }, async () => {
    const cached = publicCache.get('summary');
    if (cached) {
      return cached;
    }

    const teacherAggregationQueryCount: PipelineStage.FacetPipelineStage[] = [
      {
        $group: {
          _id: null,
          teoria: { $addToSet: '$teoria' },
          pratica: { $addToSet: '$pratica' },
        },
      },
      { $project: { teachers: { $setUnion: ['$teoria', '$pratica'] } } },
      { $unwind: { path: '$teachers', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, total: { $sum: 1 } } },
      { $project: { _id: 0 } },
    ];
    const subjectsAggregationQueryCount: PipelineStage.FacetPipelineStage[] = [
      {
        $group: { _id: null, total: { $sum: 1 } },
      },
      { $project: { _id: 0 } },
    ];
    const isBeforeKick = await ComponentModel.countDocuments({
      before_kick: { $exists: true, $ne: [] },
      season: currentQuad(),
    });
    const dataKey = isBeforeKick ? '$before_kick' : '$alunos_matriculados';
    const studentAggregationQueryCount: PipelineStage.FacetPipelineStage[] = [
      {
        $unwind: dataKey,
      },
      { $group: { _id: null, alunos: { $addToSet: dataKey } } },
      { $unwind: '$alunos' },
      { $group: { _id: null, total: { $sum: 1 } } },
    ];
    const componentStatsFacetQuery = [
      {
        $facet: {
          teachers: teacherAggregationQueryCount,
          subjects: subjectsAggregationQueryCount,
          studentTotal: studentAggregationQueryCount,
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
    ];

    const [users, currentStudents, comments, enrollments, [componentStats]] =
      await Promise.all([
        UserModel.countDocuments({}),
        StudentModel.countDocuments({}),
        CommentModel.countDocuments({}),
        EnrollmentModel.countDocuments({
          conceito: { $in: ['A', 'B', 'C', 'D', '0', 'F'] },
        }),
        ComponentModel.aggregate<ComponentsStats>(componentStatsFacetQuery),
      ]);

    const [allStudents] = componentStats.studentTotal.map(({ total }) => total);
    const summary = {
      teachers: componentStats.teachers,
      studentTotal: allStudents,
      subjects: componentStats.subjects,
      users,
      currentStudents,
      comments,
      enrollments,
    };

    publicCache.set('usage', summary);

    return summary;
  });

  app.get(
    '/graduations',
    { schema: listGraduationsSchema, logLevel: 'silent' },
    async () => {
      const graduations = await GraduationModel.find(
        {
          grade: { $exists: true },
        },
        {
          _id: 0,
          createdAt: 0,
          locked: 0,
          updatedAt: 0,
          __v: 0,
          creditsBreakdown: 0,
        },
      ).lean<GraduationList[]>();

      return graduations;
    },
  );

  app.get(
    '/stats/student',
    { schema: listStudentStats, logLevel: 'silent' },
    async (request, reply) => {
      const { season } = request.query;

      if (!season) {
        return reply.badRequest('Missing season');
      }

      const isPrevious = await ComponentModel.countDocuments({
        season,
        before_kick: { $exists: true, $ne: [] },
      });

      const dataKey = isPrevious ? '$before_kick' : '$alunos_matriculados';

      const studentsStats = await ComponentModel.aggregate([
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
    },
  );

  app.get('/stats/usage', { logLevel: 'silent' }, async () => {
    const season = currentQuad();
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
    const isPrevious = await ComponentModel.countDocuments({
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

    const [disciplinasStats] = await ComponentModel.aggregate([
      { $match: { season } },
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
      users: await UserModel.countDocuments({
        ra: {
          $exists: true,
        },
      }),
      currentAlunos: await StudentModel.countDocuments({ season }),
      comments: await CommentModel.countDocuments({}),
      enrollments: await EnrollmentModel.countDocuments({
        conceito: { $in: ['A', 'B', 'C', 'D', 'O', 'F'] },
      }),
    };

    const platformGeneralStats = Object.assign(
      {},
      disciplinasStats,
      generalStatsCount,
    );

    return platformGeneralStats;
  });
};

export default plugin;
