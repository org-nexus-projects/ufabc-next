import { Types } from 'mongoose';

import { SummaryModel } from '@/models/Summary.js';
import type { Summary } from '@/models/Summary.js';

import { BaseRepository } from './base-repository.js';
import type { BaseRepositoryOptions } from './base-repository.js';

export type SummariesRepositoryOptions = BaseRepositoryOptions & {
  model?: typeof SummaryModel;
};

export type NewSummary = Omit<
  Summary,
  'teacher' | 'subject' | 'status' | 'createdAt' | 'updatedAt'
> & {
  teacher: string;
};

export class SummariesRepository extends BaseRepository {
  private readonly model: typeof SummaryModel;

  constructor({ model, ...options }: SummariesRepositoryOptions = {}) {
    super(options);
    this.model = model ?? SummaryModel;
  }

  async findLatestActiveByTeacher(teacherId: string) {
    this.logger.debug({ teacherId }, 'Finding latest active summary');

    return await this.model
      .findOne({
        status: 'active',
        subject: null,
        teacher: new Types.ObjectId(teacherId),
      })
      .sort({ createdAt: -1 })
      .select('newestComment')
      .lean();
  }

  async create(summary: NewSummary) {
    this.logger.debug({ teacherId: summary.teacher }, 'Creating summary');

    return await this.model.create(summary);
  }
}
