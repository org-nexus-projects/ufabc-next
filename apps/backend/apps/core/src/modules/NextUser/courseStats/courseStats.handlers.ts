import type { FastifyRequest } from 'fastify';
import type { CourseStatsService } from './courseStats.service.js';

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
}
