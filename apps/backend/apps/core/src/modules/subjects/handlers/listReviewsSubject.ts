import {
  groupBy as LodashGroupBy,
  mapValues as LodashMapValues,
  merge as LodashMerge,
  sum as LodashSum,
  sumBy as LodashSumBy,
} from 'lodash-es';
import { type FilterQuery, Types } from 'mongoose';
import { type Enrollment, EnrollmentModel } from '@/models/Enrollment.js';
import { SubjectModel } from '@/models/Subject.js';
import { TeacherModel } from '@/models/Teacher.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

type Distribution = {
  conceito: 'A' | 'B' | 'C' | 'D' | 'O' | 'F';
  weight: number;
  count: number;
  cr_medio: number;
  numeric: number;
  numericWeight: number;
  amount: number;
};

type Stats = {
  _id: {
    mainTeacher: string;
  };
  distribution: Distribution[];
  numericWeight: number;
  numeric: number;
  amount: number;
  cr_professor: number;
  teacher: string;
  cr_medio: number;
};

type StatsAggregate = Stats;

type ListReviewsRequest = {
  Params: {
    subjectId: string;
  };
};

export async function listReviews(
  request: FastifyRequest<ListReviewsRequest>,
  reply: FastifyReply,
) {
  const { subjectId } = request.params;

  if (!subjectId) {
    return;
  }

  const stats = await reviewsEnrollmentAggregate(subjectId);
  stats.forEach((stat) => {
    stat.cr_medio = stat.numeric / stat.amount;
  });

  // const generalDistribution = (stats)
  //   .map('distribution')
  //   .flatten()
  //   .groupBy('conceito')
  //   .mapValues(getMean)
  //   .values()
  //   .value();

  const distributions = stats.flatMap((stat) => stat.distribution);
  // use native once node backports it
  // source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy#browser_compatibility
  const groupedDistributionsByConcept = LodashGroupBy(
    distributions,
    'conceito',
  );

  const averageGroupedDistributions = LodashMapValues(
    groupedDistributionsByConcept,
    getMean,
  ) as unknown as Stats[];
  const generalDistribution = Object.values<Stats>(averageGroupedDistributions);

  const reviewSubjectStats = {
    subject: await SubjectModel.findOne({ _id: subjectId }).lean(true),
    // need to use `merge` cause its recursive, and Object.assign is not
    general: LodashMerge(getMean(generalDistribution), {
      distribution: generalDistribution,
    }),
    specific: await TeacherModel.populate(stats, 'teacher'),
  };

  await reply.status(200).send(reviewSubjectStats);
}

const reviewsEnrollmentAggregate = async (subjectId: string) => {
  const match = {
    subject: new Types.ObjectId(subjectId),
    conceito: {
      $in: ['A', 'B', 'C', 'D', 'O', 'F'],
    },
  } satisfies FilterQuery<Enrollment>;
  const groupFirstPipeline = {
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
  };

  const fields = {
    _id: 1,
    cr_medio: 1,
    count: 1,
    weight: 1,
    crs: 1,
    amount: { $size: '$crs' },
  };

  const reviewStats = await EnrollmentModel.aggregate<StatsAggregate>([
    {
      $match: match,
    },
    {
      $group: groupFirstPipeline,
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
      $project: fields,
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

  return reviewStats;
};

const getMean = (stats: Stats[], key?: string) => {
  const count = LodashSumBy(stats, 'count');
  const amount = LodashSumBy(stats, 'amount');
  const simpleSum = stats
    .filter((stat) => stat.cr_medio !== null)
    .map((stat) => stat.amount * stat.cr_medio);

  return {
    conceito: key,
    cr_medio: LodashSum(simpleSum) / amount,
    cr_professor: LodashSumBy(stats, 'numericWeight') / amount,
    count,
    amount,
    numeric: LodashSumBy(stats, 'numeric'),
    numericWeight: LodashSumBy(stats, 'numericWeight'),
  };
};
