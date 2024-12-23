import { CommentModel } from '@/models/Comment.js';
import { type Component, ComponentModel } from '@/models/Component.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import { GraduationModel } from '@/models/Graduation.js';
import { StudentModel } from '@/models/Student.js';
import { UserModel } from '@/models/User.js';
import {
  listComponentsResume,
  listGraduationsSchema,
  listStudentStats,
  type GraduationList,
} from '@/schemas/public.js';
import { currentQuad } from '@next/common';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { FilterQuery, PipelineStage } from 'mongoose';
import { getAllCourses } from './service.js';
import { resolveStep } from '@/utils/resolve-stats-steps.js';

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

  app.get(
    '/stats/components/:action?',
    { logLevel: 'silent', schema: listComponentsResume },
    async (request, reply) => {
      const { action } = request.params;
      const { limit, page, season, courseId, ratio, turno } = request.query;

      const match: FilterQuery<Component> = { season };

      if (turno) {
        match.turno = turno;
      }

      if (courseId) {
        const courses = await getAllCourses();
        const interCourses = [
          'Bacharelado em Ciência e Tecnologia',
          'Bacharelado em Ciências e Humanidades',
        ];

        const interCourseIds = courses
          .filter(({ names }) => interCourses.includes(names))
          .flatMap(({ UFCourseIds }) => UFCourseIds);

        match.obrigatorias = { $in: [courseId] };

        if (!interCourseIds.includes(courseId)) {
          match.obrigatorias.$nin = interCourseIds;
        }
      }

      const isPrevious = await ComponentModel.countDocuments({
        season,
        before_kick: { $exists: true, $ne: [] },
      });
      const dataKey = isPrevious ? '$before_kick' : '$alunos_matriculados';

      const pipeline: any = [
        { $match: match },
        {
          $project: {
            vagas: 1,
            turno: 1,
            codigo: 1,
            disciplina: 1,
            obrigatorias: 1,
            turma: 1,
            requisicoes: { $size: { $ifNull: [dataKey, []] } },
          },
        },
        { $match: { vagas: { $gt: 0 } } },
        {
          $project: {
            vagas: 1,
            turno: 1,
            codigo: 1,
            disciplina: 1,
            obrigatorias: 1,
            requisicoes: 1,
            turma: 1,
            deficit: { $subtract: ['$requisicoes', '$vagas'] },
            ratio: { $divide: ['$requisicoes', '$vagas'] },
          },
        },
      ];

      if (ratio) {
        pipeline.push({ $match: { ratio: { $gt: ratio } } });
      }

      pipeline.push(...resolveStep(action ?? 'overview', turno, courseId));

      pipeline.push(
        {
          $facet: {
            total: [{ $count: 'total' }],
            data: [
              { $sort: { [ratio != null ? 'ratio' : 'deficit']: -1 } },
              { $skip: page * limit },
              { $limit: limit },
              {
                $project: {
                  codigo: 1,
                  disciplina: 1,
                  turma: 1,
                  turno: 1,
                  vagas: 1,
                  requisicoes: 1,
                  deficit: 1,
                  ratio: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            total: { $ifNull: [{ $arrayElemAt: ['$total.total', 0] }, 0] },
            page,
          },
        },
        {
          $project: {
            total: 1,
            data: 1,
            page: 1,
          },
        },
      );

      const [result] = await ComponentModel.aggregate(pipeline);
      return result;
    },
  );
};

export default plugin;
