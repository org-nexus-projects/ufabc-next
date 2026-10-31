import { Types } from 'mongoose';

import { CommentModel } from '@/models/Comment.js';

import { BaseRepository } from './base-repository.js';
import type { BaseRepositoryOptions } from './base-repository.js';

export type CommentsRepositoryOptions = BaseRepositoryOptions & {
  model?: typeof CommentModel;
};

export type RecentComment = {
  comment: string;
  createdAt: Date;
};

export class CommentsRepository extends BaseRepository {
  private readonly model: typeof CommentModel;

  constructor({ model, ...options }: CommentsRepositoryOptions = {}) {
    super(options);
    this.model = model ?? CommentModel;
  }

  async countActiveByTeacher(teacherId: string, createdAfter?: Date) {
    this.logger.debug({ createdAfter, teacherId }, 'Counting active comments');

    const filter: Record<string, unknown> = {
      active: true,
      teacher: new Types.ObjectId(teacherId),
    };
    if (createdAfter) {
      filter.createdAt = { $gt: createdAfter };
    }

    return await this.model.countDocuments(filter);
  }

  async findRecentActiveByTeacher(teacherId: string, limit: number) {
    this.logger.debug({ limit, teacherId }, 'Finding recent active comments');

    return await this.model
      .find(
        { active: true, teacher: new Types.ObjectId(teacherId) },
        { comment: 1, createdAt: 1 }
      )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<RecentComment[]>();
  }
}
