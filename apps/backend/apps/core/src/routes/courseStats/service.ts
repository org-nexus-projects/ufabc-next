import type { Graduation } from '@/models/Graduation.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { HistoryModel } from '@/models/History.js';

export async function getCrDistribution(points: number, interval: number) {
  const distribution = await HistoryModel.aggregate([
    {
      $match: { 'coefficients.2018.3': { $exists: true } },
    },
    { $project: { value: '$coefficients.2018.3' } },
    {
      $group: {
        _id: createDistributionGroup(points, interval),
        total: { $sum: 1 },
        point: { $avg: '$value.cr_acumulado' },
      },
    },
    {
      $sort: { point: 1 },
    },
  ]);

  return distribution;
}

export async function findLatestHistory(ra: number) {
  const lastHistory = await HistoryModel.findOne({
    ra,
  }).sort({ createdAt: -1 });

  return lastHistory;
}

export async function findOneGraduation(grade: string, curso: string) {
  const graduation = await GraduationHistoryModel.findOne({
    curso,
    grade,
  }).lean<Graduation>();

  return graduation;
}

export async function getGraduationHistory(ra: number) {
  const history = await GraduationHistoryModel.find({
    ra,
  }).lean();

  return history;
}

function createDistributionGroup(totalPoints: number, inc: number) {
  // i still dont know what this code serves for
  const branches = [...Array.from({ length: totalPoints }).keys()].map((k) => ({
    case: {
      // select where the cr_acumulado is less than inc * k
      $lt: ['$value.cr_acumulado', inc * k],
    },
    then: inc * k,
  }));

  return {
    $switch: {
      branches,
      default: inc * totalPoints,
    },
  };
}
