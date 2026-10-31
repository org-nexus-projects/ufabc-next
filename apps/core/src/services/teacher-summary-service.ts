import { Types } from 'mongoose';

import { TeacherSummaryMapper } from '@/mappers/teacher-summary-mapper.js';
import { SummaryModel } from '@/models/Summary.js';

import type { BaseServiceOptions } from './base-service.js';
import { BaseService } from './base-service.js';

export class TeacherSummaryService extends BaseService {
  private readonly mapper = new TeacherSummaryMapper();

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
      .lean();

    if (!summary) {
      this.logger.debug({ teacherId }, 'no active summary found for teacher');
      return null;
    }

    return this.mapper.toResponse(summary);
  }
}
