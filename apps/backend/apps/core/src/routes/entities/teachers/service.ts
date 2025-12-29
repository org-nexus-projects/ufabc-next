import { EnrollmentModel } from '@/models/Enrollment.js';
import { SubjectModel, type Subject } from '@/models/Subject.js';
import { TeacherModel, type Teacher } from '@/models/Teacher.js';
import { Types } from 'mongoose';

type SearchResult = {
  total: number;
  data: Array<{
    _id: string;
    name: string;
    alias: string[];
  }>;
};

export async function rawReviews(teacherId: Types.ObjectId) {
  const rawStats = await EnrollmentModel.aggregate<any>([
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
                  ['2020:1', '2020:2', '2020:3', '2021:1', '2021:2', '2021:3', '2022:1', '2022:2'],
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
          $cond: [{ $eq: ['$amount', 0] }, 'N/A', { $divide: ['$numericWeight', '$amount'] }],
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

export async function populateWithSubject(stats: any) {
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
    { new: true },
  ).lean<Teacher>();

  return teacherWithAlias;
}

export async function listAll() {
  const teachers = await TeacherModel.find({}, { _id: 0, name: 1, alias: 1 }).lean<
    { name: string; alias: string[] }[]
  >();
  return teachers;
}
