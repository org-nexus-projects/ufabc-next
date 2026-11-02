import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { QueryFilter as FilterQuery } from 'mongoose';

import { currentQuad } from '@next/utils';

import { CommentModel } from '@/models/Comment.js';
import { type Component, ComponentModel } from '@/models/Component.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import { StudentModel } from '@/models/Student.js';
import { UserModel } from '@/models/User.js';
import { listComponentsResume } from '@/schemas/public.js';
import { resolveStep } from '@/utils/resolve-stats-steps.js';

import { getAllCourses } from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
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
      currentAlunos: await StudentModel.countDocuments({
        season,
        active: { $ne: false },
      }),
      comments: await CommentModel.countDocuments({}),
      enrollments: await EnrollmentModel.countDocuments({
        conceito: { $in: ['A', 'B', 'C', 'D', 'O', 'F'] },
      }),
    };

    const platformGeneralStats = Object.assign(
      {},
      disciplinasStats,
      generalStatsCount
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

      if (action) {
        pipeline.push(...resolveStep(action, turno, courseId));
      }

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
        }
      );

      const [result] = await ComponentModel.aggregate(pipeline);
      return result;
    }
  );
};

export default plugin;
