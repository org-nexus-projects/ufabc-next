import type { Types } from 'mongoose';

import type { Concept } from '@/models/History.js';
import type { Subject } from '@/models/Subject.js';

import { EnrollmentModel } from '@/models/Enrollment.js';
import { SubjectModel } from '@/models/Subject.js';
import { TeacherModel } from '@/models/Teacher.js';

export type Distribution = {
  conceito: Concept;
  weight: number;
  count: number;
  cr_medio: number;
  numeric: number;
  numericWeight: number;
  amount: number;
  cr_professor: number;
};

type ReviewsAggregate = {
  _id: {
    mainTeacher: Types.ObjectId;
  };
  numericWeight: number;
  numeric: number;
  amount: number;
  count: number;
  cr_professor: number;
  teacher: Types.ObjectId;
  distribution: Array<Distribution>;
  cr_medio: number;
};

export async function rawSubjectsReviews(subjectId: Types.ObjectId) {
  const rawStats = await EnrollmentModel.aggregate<ReviewsAggregate>([
    {
      $match: {
        subject: subjectId,
        conceito: { $in: ['A', 'B', 'C', 'D', 'O', 'F'] },
      },
    },
    {
      $group: {
        _id: {
          mainTeacher: '$mainTeacher',
          conceito: '$conceito',
          subject: '$subject',
        },
        cr_medio: { $avg: '$cr_acumulado' },
        count: { $sum: 1 },
        crs: { $push: '$cr_acumulado' },
        weight: {
          $first: {
            $switch: {
              branches: [
                { case: { $eq: ['$conceito', 'A'] }, then: 4 },
                { case: { $eq: ['$conceito', 'B'] }, then: 3 },
                { case: { $eq: ['$conceito', 'C'] }, then: 2 },
                { case: { $eq: ['$conceito', 'D'] }, then: 1 },
                { case: { $eq: ['$conceito', 'O'] }, then: 0 },
                { case: { $eq: ['$conceito', 'F'] }, then: 0 },
              ],
              default: null,
            },
          },
        },
      },
    },
    {
      $addFields: {
        crs: {
          $filter: {
            input: '$crs',
            as: 'd',
            cond: { $ne: ['$$d', null] },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        cr_medio: 1,
        count: 1,
        weight: 1,
        crs: 1,
        amount: { $size: '$crs' },
      },
    },
    {
      $group: {
        _id: {
          mainTeacher: '$_id.mainTeacher',
        },
        distribution: {
          $push: {
            conceito: '$_id.conceito',
            weight: '$weight',
            count: '$count',
            cr_medio: '$cr_medio',
            numeric: { $multiply: ['$amount', '$cr_medio'] },
            numericWeight: { $multiply: ['$amount', '$weight'] },
            amount: '$amount',
          },
        },
        numericWeight: { $sum: { $multiply: ['$amount', '$weight'] } },
        numeric: { $sum: { $multiply: ['$amount', '$cr_medio'] } },
        amount: { $sum: '$amount' },
        count: { $sum: '$count' },
      },
    },
    {
      $project: {
        distribution: 1,
        numericWeight: 1,
        numeric: 1,
        amount: 1,
        count: 1,
        cr_professor: {
          $cond: [
            { $eq: ['$amount', 0] },
            'N/A',
            { $divide: ['$numericWeight', '$amount'] },
          ],
        },
        teacher: '$_id.mainTeacher',
      },
    },
  ]);
  return rawStats;
}

export function getMean(value: Distribution[], key?: string): Distribution {
  const count = value.reduce((sum, v) => sum + v.count, 0);
  const amount = value.reduce((sum, v) => sum + v.amount, 0);
  const simpleSum = value
    .filter((v) => v.cr_medio != null)
    .reduce((sum, v) => sum + v.amount * v.cr_medio, 0);

  return {
    conceito: key as Distribution['conceito'],
    cr_medio: simpleSum / amount,
    cr_professor: value.reduce((sum, v) => sum + v.numericWeight, 0) / amount,
    count,
    amount: amount,
    numeric: value.reduce((sum, v) => sum + v.numeric, 0),
    numericWeight: value.reduce((sum, v) => sum + v.numericWeight, 0),
    weight: 0, // Added to match the Distribution interface
  };
}

export async function buildSubjectReviews(subjectId: Types.ObjectId) {
  const stats = await rawSubjectsReviews(subjectId);
  stats.forEach((s) => {
    s.cr_medio = s.numeric / s.amount;
  });

  const generalDistribution = stats
    .flatMap((stat) => stat.distribution)
    .reduce(
      (acc, dist) => {
        if (!acc[dist.conceito]) {
          acc[dist.conceito] = [];
        }
        acc[dist.conceito].push(dist);
        return acc;
      },
      {} as Record<string, Distribution[]>
    );

  const generalDistributions = Object.entries(generalDistribution).map(
    ([key, value]) => getMean(value, key)
  );

  const subject = await SubjectModel.findOne({
    _id: subjectId,
  }).lean();
  const teacher = await TeacherModel.populate(stats, 'teacher');

  return {
    subject: subject as NonNullable<Subject>,
    general: {
      ...getMean(generalDistributions),
      distribution: generalDistributions,
    },
    specific: teacher,
  };
}
