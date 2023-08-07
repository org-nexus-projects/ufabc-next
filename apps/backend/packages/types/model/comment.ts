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
    query: unknown,
    userId: string,
    populateFields: string[],
    limit: number,
    page: number,
  ): Promise<{ data: unknown; total: number }>;
}
