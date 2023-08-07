import type { Document, Query, Types } from 'mongoose';
import type { User } from './user';
import type { Comment } from './comment';

export type Reaction = {
  kind: 'like' | 'recommendation' | 'star';
  comment: Types.ObjectId & Comment;
  user: Types.ObjectId & User;
  active: boolean;
  slug: string;
};

export type ReactionDocument = Document<Types.ObjectId, unknown, Reaction> &
  Reaction;
export type ReactionQuery = Query<Reaction, Reaction>;
