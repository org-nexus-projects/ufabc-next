import type { FilterQuery, PipelineStage } from 'mongoose';
import type { HistoryModel } from '@/models/History.js';
import type {
  GraduationHistory,
  GraduationHistoryModel,
} from '@/models/GraduationHistory.js';
import type { Graduation, GraduationModel } from '@/models/Graduation.js';

type CRDistributionAggregate = {
  _id: number;
  total: number;
  point: number;
};

interface UserCourseStatsRepository {
  findCRDistribution(
    pipeline: PipelineStage[],
  ): Promise<CRDistributionAggregate[]>;
  findUserGraduationHistory(
    options: FilterQuery<GraduationHistory>,
  ): Promise<GraduationHistory['coefficients']>;
  findMostRecentGraduationHistory(
    options: FilterQuery<GraduationHistory>,
  ): Promise<GraduationHistory | null>;
  findGraduation(
    options: FilterQuery<GraduationHistory>,
  ): Promise<Graduation | null>;
}

export class CourseStatsRepository implements UserCourseStatsRepository {
  constructor(
    private readonly historyService: typeof HistoryModel,
    private readonly graduationHistoryService: typeof GraduationHistoryModel,
    private readonly graduationService: typeof GraduationModel,
  ) {}

  async findCRDistribution(pipeline: PipelineStage[]) {
    const usersCrDistribution =
      await this.historyService.aggregate<CRDistributionAggregate>(pipeline);

    return usersCrDistribution;
  }

  async findUserGraduationHistory(options: FilterQuery<GraduationHistory>) {
    const graduationHistory = await this.graduationHistoryService
      // eslint-disable-next-line unicorn/no-array-callback-reference
      .find(options)
      .select({ coefficients: 1, curso: 1, grade: 1, graduation: 1 })
      .lean<GraduationHistory['coefficients']>({
        virtuals: true,
      });
    return graduationHistory;
  }

  // This method should die, and the above him should be smarter, but gonna do this later
  async findMostRecentGraduationHistory(
    options: FilterQuery<GraduationHistory>,
  ) {
    const mostRecentHistory = await this.graduationHistoryService
      .findOne(options)
      .sort({ createdAt: -1 });

    return mostRecentHistory;
  }

  async findGraduation(options: FilterQuery<GraduationHistory>) {
    const graduation = await this.graduationService
      .findOne(options)
      .lean<Graduation>(true);

    return graduation;
  }
}
