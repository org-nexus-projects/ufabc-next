import { type ObjectId, Types } from 'mongoose';
import { EnrollmentModel } from '@/models/Enrollment.js';
import type { SubjectRepository } from './subjects.repository.js';

type SubjectReviewAggregate = {
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

export class SubjectService {
  constructor(private readonly subjectRepository: SubjectRepository) {}

  async findSubject(search: RegExp) {
    const [searchResults] = await this.subjectRepository.searchSubject([
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

  async createSubject(name: string) {
    // @ts-expect-error hate timestamps
    const subject = await this.subjectRepository.createSubject({
      name,
    });
    return subject;
  }

  async listSubjects() {
    const subjects = await this.subjectRepository.listSubject({});
    return subjects;
  }

  async subjectReviews(subjectId: string) {
    const validSubjectId = new Types.ObjectId(subjectId);
    const subjectReview =
      await EnrollmentModel.aggregate<SubjectReviewAggregate>([
        {
          $match: {
            subject: validSubjectId,
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
    return subjectReview;
  }
}
