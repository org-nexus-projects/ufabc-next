import type { Graduation, GraduationModel } from '@/models/Graduation.js';
import type { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';
import type { History, HistoryModel } from '@/models/History.js';

interface UserHistoryRepository {
  findOneAndUpdate(
    filter: FilterQuery<History>,
    data: UpdateQuery<History>,
    opts?: QueryOptions<History>,
  ): Promise<void>;
  findOneGraduation(
    options: FilterQuery<Graduation>,
  ): Promise<Graduation | null>;
  findOneAndUpdateGraduation(
    filter: FilterQuery<Graduation>,
    data: UpdateQuery<Graduation>,
    opts?: QueryOptions<Graduation>,
  ): Promise<void>;
}

export class HistoryRepository implements UserHistoryRepository {
  constructor(
    private readonly historyService: typeof HistoryModel,
    private readonly graduationService: typeof GraduationModel,
  ) {}
  async findOneAndUpdate(
    filter: FilterQuery<History>,
    data: UpdateQuery<History>,
    opts?: QueryOptions<History>,
  ) {
    await this.historyService.findOneAndUpdate(filter, data, opts);
  }

  async findOneGraduation(options: FilterQuery<Graduation>) {
    const userGraduation = await this.graduationService
      .findOne(options)
      .lean(true);
    return userGraduation;
  }

  async findOneAndUpdateGraduation(
    filter: FilterQuery<Graduation>,
    data: UpdateQuery<Graduation>,
    opts?: QueryOptions<Graduation>,
  ) {
    await this.graduationService.findOneAndUpdate(filter, data, opts);
  }
}
