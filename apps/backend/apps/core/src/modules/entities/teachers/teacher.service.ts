import { type FilterQuery, type ObjectId, Types } from 'mongoose';
import { EnrollmentModel } from '@/models/Enrollment.js';
import type { TeacherRepository } from './teacher.repository.js';
import type { Teacher } from '@/models/Teacher.js';

type TeacherReviewAggregate = {
  _id: {
    mainTeacher: ObjectId;
  };
  distribution: [
    {
      conceito: 'A' | 'B' | 'C' | 'D' | 'O' | 'F' | '-' | null;
      weigth: number;
      count: number;
      cr_medio: number;
      numeric: number;
      numericWeight: number;
      amount: number;
    },
  ];
  count: number;
  cr_professor: number;
  numeric: number;
  numericWeight: number;
  amount: number;
  teacher: ObjectId;
  cr_medio?: number;
};

export class TeacherService {
  constructor(private readonly teacherRepository: TeacherRepository) {}

  async listTeachers(options: FilterQuery<Teacher>) {
    const teachers = await this.teacherRepository.findTeacher(options);
    return teachers;
  }

  async insertTeacher(data: Teacher) {
    const newTeacher = await this.teacherRepository.insertTeacher(data);
    return newTeacher;
  }

  async setTeacherAlias(teacherId: string, alias: string[]) {
    const teacherWithAlias = await this.teacherRepository.findAndUpdateTeacher(
      {
        _id: teacherId,
      },
      { alias },
    );

    return teacherWithAlias;
  }

  async findTeacher(search: RegExp) {
    const [searchResults] = await this.teacherRepository.searchTeacher([
      {
        $match: { name: search },
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

  async teacherReviews(teacherId: string) {
    const validTeacherId = new Types.ObjectId(teacherId);
    const teacherReview =
      await EnrollmentModel.aggregate<TeacherReviewAggregate>([
        {
          $match: {
            mainTeacher: validTeacherId,
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
            _id: '$_id.subject',
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
          },
        },
      ]);
    return teacherReview;
  }
}
