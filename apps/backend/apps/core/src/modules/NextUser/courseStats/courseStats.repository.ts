import type { PipelineStage } from 'mongoose';
import type { HistoryModel } from '@/models/History.js';

type CRDistributionAggregate = {
  _id: number;
  total: number;
  point: number;
};

interface UserCourseStatsRepository {
  findCRDistribution(
    pipeline: PipelineStage[],
  ): Promise<CRDistributionAggregate[]>;
}

export class CourseStatsRepository implements UserCourseStatsRepository {
  constructor(private readonly historyService: typeof HistoryModel) {}

  async findCRDistribution(pipeline: PipelineStage[]) {
    const usersCrDistribution =
      await this.historyService.aggregate<CRDistributionAggregate>(pipeline);

    return usersCrDistribution;
  }
}
