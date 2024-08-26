//@ts-nocheck
import type { FastifyRequest, FastifyReply } from 'fastify';
import { Types } from 'mongoose';
import { TeacherModel } from '@/models/Teacher.js';
import { SubjectModel } from '@/models/Subject.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import { LRUCache } from 'lru-cache';

interface SubjectReviewParams {
  subjectId: string;
}

type Concept = 'A' | 'B' | 'C' | 'D' | 'O' | 'F';

interface Distribution {
  conceito: Concept;
  weight: number;
  count: number;
  cr_medio: number;
  numeric: number;
  numericWeight: number;
  amount: number;
}

// Initialize LRU Cache
const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 60 * 24, // 1 day in milliseconds
});

export async function subjectReviews(
  request: FastifyRequest<{ Params: SubjectReviewParams }>,
  reply: FastifyReply,
) {
  const { subjectId } = request.params;

  if (!subjectId) {
    return reply.badRequest('Missing subjectId');
  }

  const cacheKey = `reviews_${subjectId}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const objectId = new Types.ObjectId(subjectId);

  const stats = await EnrollmentModel.aggregate([
    {
      $match: {
        subject: objectId,
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

  stats.forEach((s) => {
    s.cr_medio = s.numeric / s.amount;
  });

  function getMean(value: Distribution[], key: string): Distribution {
    const count = value.reduce((sum, v) => sum + v.count, 0);
    const amount = value.reduce((sum, v) => sum + v.amount, 0);
    const simpleSum = value
      .filter((v) => v.cr_medio != null)
      .reduce((sum, v) => sum + v.amount * v.cr_medio, 0);

    return {
      conceito: key as Concept,
      cr_medio: simpleSum / amount,
      cr_professor: value.reduce((sum, v) => sum + v.numericWeight, 0) / amount,
      count: count,
      amount: amount,
      numeric: value.reduce((sum, v) => sum + v.numeric, 0),
      numericWeight: value.reduce((sum, v) => sum + v.numericWeight, 0),
      weight: 0, // Added to match the Distribution interface
    };
  }

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
      {} as Record<Concept, Distribution[]>,
    );

  const generalDistributionArray = Object.entries(generalDistribution).map(
    ([key, value]) => getMean(value, key),
  );

  const resp = {
    subject: await SubjectModel.findOne({ _id: objectId }).lean(),
    general: {
      ...getMean(generalDistributionArray),
      distribution: generalDistributionArray,
    },
    specific: await TeacherModel.populate(stats, 'teacher'),
  };

  // Store in LRU Cache
  cache.set(cacheKey, resp);

  return resp;
}
