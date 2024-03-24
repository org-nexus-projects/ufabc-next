import { calculateCoefficients } from '@next/common';
import type { GraduationHistory } from '@/models/GraduationHistory.js';
import type { CourseStatsService } from './courseStats.service.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export class CourseStatsHandlers {
  constructor(private readonly courseStatsService: CourseStatsService) {}

  async gradesStats() {
    // TODO: discover why points is a 40 constant
    const POINTS = 40;
    const INTERVAL = 4 / POINTS;

    const rawDistribution = await this.courseStatsService.usersCrDistribution(
      POINTS,
      INTERVAL,
    );

    const distributions = [];
    for (const distribution of rawDistribution) {
      // @ts-expect-error doesn't harm
      distribution._id = distribution._id.toFixed(2);
      // @ts-expect-error doesn't harm
      distribution.point = distribution.point.toFixed(2);
      distributions.push(distribution);
    }

    return distributions;
  }

  async graduationHistory(
    request: FastifyRequest<{ Querystring: { ra: number } }>,
  ) {
    const userHistory = await this.courseStatsService.userGraduationHistory(
      request.user?.ra ?? request.query.ra,
    );
    return { docs: userHistory };
  }

  async userGraduationStats(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;

    // This code is necessary for show data to performance page - get the coefficients from the last history
    // Example: users with BCT concluded and BCC in progress will have the BCC coefficients showed on the performance screen.
    const lastHistory =
      await this.courseStatsService.recentUserGraduationHistory(user?.ra);

    // Next step
    // Needs to add a querie to get the coefficients from the first historyGraduatiation and show that on the performance screen.
    // that already exists its this endpoint  `/graduation/histories`

    if (!lastHistory) {
      return reply.notFound('User History not found');
    }

    let graduation = null;
    if (lastHistory.curso && lastHistory.grade) {
      graduation = await this.courseStatsService.findGraduation(
        lastHistory.curso,
        lastHistory.grade,
      );
    }

    const coefficients =
      lastHistory.coefficients ||
      calculateCoefficients(lastHistory.disciplinas || [], graduation);

    const normalizedHistory = normalizeHistory(coefficients);

    return normalizedHistory;
  }
}

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
