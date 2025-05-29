import { gradesStatsSchema, userGradesSchema } from '@/schemas/courseStats.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import {
  findLatestHistory,
  findOneGraduation,
  getCrDistribution,
  getGraduationHistory,
} from './service.js';
import { calculateCoefficients } from '@next/common';
import type { GraduationHistory } from '@/models/GraduationHistory.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/grades', { schema: gradesStatsSchema }, async (request, reply) => {
    // TODO: discover why points is a 40 constant
    const POINTS = 40;
    const INTERVAL = 4 / POINTS;
    const rawDistribution = await getCrDistribution(POINTS, INTERVAL);
    const distributions = [];
    for (const distribution of rawDistribution) {
      distribution._id = distribution._id.toFixed(2);
      distribution.point = distribution.point.toFixed(2);
      distributions.push(distribution);
    }

    return distributions;
  });

  app.get('/history', { schema: userGradesSchema }, async ({ user }, reply) => {
    // This code is necessary for show data to performance page - get the coefficients from the last history
    // Example: users with BCT concluded and BCC in progress will have the BCC coefficients showed on the performance screen.
    const lastHistory = await findLatestHistory(user.ra);

    // Next step
    // Needs to add a querie to get the coefficients from the first historyGraduatiation and show that on the performance screen.
    // that already exists its this endpoint  `/graduation/histories`

    if (!lastHistory) {
      return reply.notFound('User History not found');
    }

    let graduation = null;
    if (lastHistory.curso && lastHistory.grade) {
      graduation = await findOneGraduation(
        lastHistory.curso,
        lastHistory.grade,
      );
    }

    const coefficients =
      lastHistory.coefficients ||
      // @ts-ignore for now
      calculateCoefficients(lastHistory.disciplinas ?? [], graduation);
    const normalizedHistory = normalizeHistory(coefficients);

    return normalizedHistory;
  });

  app.get('/user/grades', async ({ user }) => {
    const userHistory = await getGraduationHistory(user.ra);
    if (userHistory.length === 0) {
      return null;
    }
    return { docs: userHistory };
  });
};

function normalizeHistory(history: GraduationHistory['coefficients']) {
  const total = [];

  for (const graduationYear of Object.keys(history)) {
    const graduationQuad = history[Number.parseInt(graduationYear)];

    for (const month of Object.keys(graduationQuad)) {
      total.push(
        // @ts-expect-error Ignore for now
        Object.assign(graduationQuad[Number.parseInt(month)], {
          season: `${graduationYear}:${month}`,
          quad: Number.parseInt(month),
          year: Number.parseInt(graduationYear),
        }),
      );
    }
  }

  return total;
}

export default plugin;
