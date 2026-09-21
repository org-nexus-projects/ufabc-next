import type { PipelineStage } from 'mongoose';

import { httpErrors } from '@fastify/sensible';
import { calculateCoefficients, lastQuad } from '@next/utils';

import type { Graduation } from '@/models/Graduation.js';
import type { Coefficient, CoefficientsMap } from '@/models/History.js';

import {
  type GraduationHistory,
  GraduationHistoryModel,
} from '@/models/GraduationHistory.js';
import { HistoryModel } from '@/models/History.js';

type RawDistribution = {
  _id: number;
  total: number;
  point: number;
};

type NormalizedCoefficient = Coefficient & {
  season: string;
  quad: number;
  year: number;
};

export async function getCrDistribution(points: number, interval: number) {
  const { year, quad } = lastQuad();
  const coefficientsKey = `coefficients.${year}.${quad}`;

  const pipeline: PipelineStage[] = [
    {
      $match: { [coefficientsKey]: { $exists: true } },
    },
    { $project: { value: `$${coefficientsKey}` } },
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
  ];

  const distribution = await HistoryModel.aggregate<RawDistribution>(pipeline);

  return distribution;
}

export async function findLatestHistory(ra: number) {
  const lastHistory = await HistoryModel.findOne({
    ra,
    disciplinas: { $ne: [] },
  }).sort({ updatedAt: -1 });

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

export async function buildCrDistribution() {
  // TODO: discover why points is a 40 constant
  const POINTS = 40;
  const INTERVAL = 4 / POINTS;
  const rawDistribution = await getCrDistribution(POINTS, INTERVAL);

  return rawDistribution.map((distribution) => ({
    _id: distribution._id.toFixed(2),
    total: distribution.total,
    point: distribution.point.toFixed(2),
  }));
}

export async function buildUserHistory(ra: number) {
  // This code is necessary for show data to performance page - get the coefficients from the last history
  // Example: users with BCT concluded and BCC in progress will have the BCC coefficients showed on the performance screen.
  const lastHistory = await findLatestHistory(ra);

  // Next step
  // Needs to add a querie to get the coefficients from the first historyGraduatiation and show that on the performance screen.
  // that already exists its this endpoint  `/graduation/histories`

  if (!lastHistory) {
    throw httpErrors.notFound('User History not found');
  }

  let graduation: Graduation | null = null;
  if (lastHistory.curso && lastHistory.grade) {
    graduation = await findOneGraduation(lastHistory.curso, lastHistory.grade);
  }

  const coefficients =
    lastHistory.coefficients ||
    calculateCoefficients(
      (lastHistory.disciplinas ?? []) as Parameters<
        typeof calculateCoefficients
      >[0],
      graduation
    );

  return normalizeHistory(coefficients);
}

export async function listUserGraduationHistories(ra: number) {
  const userHistory = await getGraduationHistory(ra);
  if (userHistory.length === 0) {
    return null;
  }
  return { docs: userHistory };
}

function normalizeHistory(history: GraduationHistory['coefficients']) {
  const total: NormalizedCoefficient[] = [];

  for (const graduationYear of Object.keys(history)) {
    const graduationQuad = history[Number.parseInt(graduationYear)];

    for (const month of Object.keys(graduationQuad)) {
      const quadKey = String(Number.parseInt(month)) as keyof CoefficientsMap;

      total.push(
        Object.assign(graduationQuad[quadKey], {
          season: `${graduationYear}:${month}`,
          quad: Number.parseInt(month),
          year: Number.parseInt(graduationYear),
        })
      );
    }
  }

  return total;
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
