import type { Model, Types } from 'mongoose';

export type Comment = {
  comment: string;
  viewers: number;
  enrollment: Types.ObjectId;
  type: 'teoria' | 'pratica';
  ra: string;
  active: boolean;
  teacher: Types.ObjectId;
  subject: Types.ObjectId;
  // alias for better `object` type
  reactionsCount: Record<string, unknown>;
};

export interface ICommentModel extends Model<Comment> {
  commentsByReactions(
    userId: string | Record<string, unknown>,
    populateFields: string[],
    limit: number,
    page: number,
    query?: unknown,
  ): Promise<{ data: unknown; total: number }>;
}
