import type { FilterQuery, PipelineStage } from 'mongoose';
import type { HistoryModel } from '@/models/History.js';
import type {
  GraduationHistory,
  GraduationHistoryModel,
} from '@/models/GraduationHistory.js';

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
}

export class CourseStatsRepository implements UserCourseStatsRepository {
  constructor(
    private readonly historyService: typeof HistoryModel,
    private readonly graduationHistoryService: typeof GraduationHistoryModel,
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
}
