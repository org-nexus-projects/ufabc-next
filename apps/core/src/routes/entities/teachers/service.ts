import { Types } from 'mongoose';

import { EnrollmentModel } from '@/models/Enrollment.js';
import { SubjectModel, type Subject } from '@/models/Subject.js';
import { TeacherModel, type Teacher } from '@/models/Teacher.js';

type SearchResult = {
  total: number;
  data: Array<{
    _id: string;
    name: string;
    alias: string[];
  }>;
};

type TeacherDistribution = {
  conceito: string;
  weight: number | null;
  count: number;
  eadCount: number;
  cr_medio: number | null;
  numeric: number;
  numericWeight: number;
  amount: number;
};

type TeacherReviewsAggregate = {
  _id: Types.ObjectId;
  distribution: TeacherDistribution[];
  numericWeight: number;
  numeric: number;
  amount: number;
  count: number;
  eadCount: number;
  cr_professor: number | 'N/A';
  cr_medio?: number;
};

type MeanInput = Pick<
  TeacherDistribution,
  'amount' | 'count' | 'cr_medio' | 'eadCount' | 'numeric' | 'numericWeight'
>;

export async function rawReviews(teacherId: Types.ObjectId) {
  const rawStats = await EnrollmentModel.aggregate<TeacherReviewsAggregate>([
    {
      $match: {
        mainTeacher: teacherId,
        conceito: { $in: ['A', 'B', 'C', 'D', 'O', 'F'] },
      },
    },
    {
      $group: {
        _id: {
          conceito: '$conceito',
          subject: '$subject',
        },
        cr_medio: { $avg: '$cr_acumulado' },
        count: { $sum: 1 },
        eadCount: {
          $sum: {
            $cond: [
              {
                $in: [
                  '$season',
                  [
                    '2020:1',
                    '2020:2',
                    '2020:3',
                    '2021:1',
                    '2021:2',
                    '2021:3',
                    '2022:1',
                    '2022:2',
                  ],
                ],
              },
              1,
              0,
            ],
          },
        },
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
        eadCount: 1,
        weight: 1,
        crs: 1,
        amount: { $size: '$crs' },
      },
    },
    {
      $group: {
        _id: '$_id.subject',
        distribution: {
          $push: {
            conceito: '$_id.conceito',
            weight: '$weight',
            count: '$count',
            eadCount: '$eadCount',
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
        eadCount: { $sum: '$eadCount' },
      },
    },
    {
      $project: {
        distribution: 1,
        numericWeight: 1,
        numeric: 1,
        amount: 1,
        count: 1,
        eadCount: 1,
        cr_professor: {
          $cond: [
            { $eq: ['$amount', 0] },
            'N/A',
            { $divide: ['$numericWeight', '$amount'] },
          ],
        },
      },
    },
  ]);
  return rawStats;
}

export async function findOne(id: string) {
  const teacher = await TeacherModel.findOne({
    _id: id,
  }).lean<Subject & { _id: string }>();

  return teacher;
}

export async function populateWithSubject(stats: TeacherReviewsAggregate[]) {
  const populatedSubject = await SubjectModel.populate(stats, '_id');
  return populatedSubject;
}

export async function searchMany(q: string) {
  const searchResults = await TeacherModel.aggregate<SearchResult>([
    {
      $match: { name: new RegExp(q, 'gi') },
    },
    {
      $facet: {
        total: [{ $count: 'total' }],
        data: [{ $limit: 10 }],
      },
    },
    {
      $addFields: {
        total: { $ifNull: [{ $arrayElemAt: ['$total.total', 0] }, 0] },
      },
    },
    {
      $project: {
        total: 1,
        data: 1,
      },
    },
  ]);
  return searchResults;
}

export async function findAndUpdate(id: string, alias: string) {
  const teacherWithAlias = await TeacherModel.findOneAndUpdate(
    { _id: new Types.ObjectId(id) },
    { alias },
    { new: true }
  ).lean<Teacher>();

  return teacherWithAlias;
}

export async function listAll() {
  const teachers = await TeacherModel.find(
    {},
    { _id: 0, name: 1, alias: 1 }
  ).lean<{ name: string; alias: string[] }[]>();
  return teachers;
}


export function getMean(value: MeanInput[], key?: string) {
  const count = value.reduce((sum, v) => sum + v.count, 0);
  const amount = value.reduce((sum, v) => sum + v.amount, 0);
  const eadCount = value.reduce((sum, v) => sum + v.eadCount, 0);
  const simpleSum = value
    .filter((v): v is MeanInput & { cr_medio: number } => v.cr_medio != null)
    .reduce((sum, v) => sum + v.amount * v.cr_medio, 0);

  return {
    conceito: key,
    cr_medio: simpleSum / amount,
    cr_professor: value.reduce((sum, v) => sum + v.numericWeight, 0) / amount,
    count,
    eadCount,
    amount: amount,
    numeric: value.reduce((sum, v) => sum + v.numeric, 0),
    numericWeight: value.reduce((sum, v) => sum + v.numericWeight, 0),
    weight: 0, // Added to match the Distribution interface
  };
}

export async function buildTeacherReviews(teacherId: string) {
  const validTeacherId = new Types.ObjectId(teacherId);
  const stats = await rawReviews(validTeacherId);
  stats.forEach((s) => {
    s.cr_medio = s.numeric / s.amount;
  });

  const generalDistribution = stats
    .flatMap((stat) => stat.distribution)
    .reduce((acc, dist) => {
      if (!acc[dist.conceito]) {
        acc[dist.conceito] = [];
      }
      acc[dist.conceito].push(dist);
      return acc;
    }, {} as Record<string, TeacherDistribution[]>);

  const generalDistributions = Object.entries(generalDistribution).map(
    ([key, value]) => getMean(value, key)
  );

  const teacher = await findOne(teacherId);
  const populatedSubject = await populateWithSubject(stats);

  return {
    teacher,
    general: {
      ...getMean(generalDistributions),
      distribution: generalDistributions,
    },
    specific: populatedSubject,
  };
}
