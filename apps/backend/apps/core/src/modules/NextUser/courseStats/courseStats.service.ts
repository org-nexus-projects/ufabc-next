import type { CourseStatsRepository } from './courseStats.repository.js';

export class CourseStatsService {
  constructor(private readonly courseStatsRepository: CourseStatsRepository) {}

  async usersCrDistribution(point: number, interval: number) {
    const crDistribution = await this.courseStatsRepository.findCRDistribution([
      {
        $match: { 'coefficients.2018.3': { $exists: true } },
      },
      { $project: { value: '$coefficients.2018.3' } },
      {
        $group: {
          _id: this.createDistributionGroup(point, interval),
          total: { $sum: 1 },
          point: { $avg: '$value.cr_acumulado' },
        },
      },
      {
        $sort: { point: 1 },
      },
    ]);
    return crDistribution;
  }

  async userGraduationHistory(ra: number) {
    const graduationHistory =
      await this.courseStatsRepository.findUserGraduationHistory({
        ra,
      });

    return graduationHistory;
  }

  private createDistributionGroup(totalPoints: number, inc: number) {
    // i still dont know what this code serves for
    const branches = [...Array.from({ length: totalPoints }).keys()].map(
      (k) => ({
        case: {
          // select where the cr_acumulado is less than inc * k
          $lt: ['$value.cr_acumulado', inc * k],
        },
        then: inc * k,
      }),
    );

    return {
      $switch: {
        branches,
        default: inc * totalPoints,
      },
    };
  }
}
