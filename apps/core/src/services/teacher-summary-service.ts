import { Types } from 'mongoose';

import type { Summary } from '@/models/Summary.js';
import { SummaryModel } from '@/models/Summary.js';

import type { BaseServiceOptions } from './base-service.js';
import { BaseService } from './base-service.js';

export type LatestSummary = Omit<Summary, 'teacher'> & { teacher: string };

export class TeacherSummaryService extends BaseService {
  constructor(options: BaseServiceOptions = {}) {
    super(options);
  }

  async findLatest(teacherId: string) {
    const summary = await SummaryModel.findOne({
      status: 'active',
      subject: null,
      teacher: new Types.ObjectId(teacherId),
    })
      .sort({ createdAt: -1 })
      .lean<LatestSummary>();

    if (!summary) {
      this.logger.debug({ teacherId }, 'no active summary found for teacher');
    }

    return summary;
  }
}
