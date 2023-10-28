import {
  CommentModel,
  DisciplinaModel,
  EnrollmentModel,
  StudentModel,
  UserModel,
} from '@next/models';
import { logger } from '@next/common';
import type { PipelineStage } from 'mongoose';

type DisciplinaStats = {
  teachers: number;
  subjects: number;
  totalAlunos: number;
  studentTotal: Array<{ total: number; _id: null }>;
};

export async function nextUsageInfo() {
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
  const isBeforeKick = await DisciplinaModel.count({
    before_kick: { $exists: true, $ne: [] },
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
  const disciplinaStatsFacetQuery = [
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

  try {
    const [users, currentStudents, comments, enrollments, [disciplinaStats]] =
      await Promise.all([
        UserModel.count({}),
        StudentModel.count({}),
        CommentModel.count({}),
        EnrollmentModel.count({
          conceito: { $in: ['A', 'B', 'C', 'D', '0', 'F'] },
        }),
        DisciplinaModel.aggregate<DisciplinaStats>(disciplinaStatsFacetQuery),
      ]);

    const [allStudents] = disciplinaStats.studentTotal.map(
      ({ total }) => total,
    );

    return {
      teachers: disciplinaStats.teachers,
      studentTotal: allStudents,
      subjects: disciplinaStats.subjects,
      users,
      currentStudents,
      comments,
      enrollments,
    };
  } catch (error) {
    logger.error({ error }, 'Error in Next Usage Service');
    throw error;
  }
}
