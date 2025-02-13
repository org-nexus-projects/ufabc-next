import { type Comment, CommentModel } from '@/models/Comment.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import { type Reaction, ReactionModel } from '@/models/Reaction.js';
import type { AnyObject, FilterQuery, Types } from 'mongoose';

export async function getUserEnrollments(ra: number) {
  const userEnrollments = await EnrollmentModel.find({
    ra,
  }).lean();

  return userEnrollments;
}

export async function getUserComments(ra: number) {
  const userComments = await CommentModel.find({ ra }).lean();
  return userComments;
}

export async function findById(id: string) {
  const enrollment = await EnrollmentModel.findById(id);

  return enrollment;
}

export async function insert(comment: Partial<Comment>) {
  const createdComment = await CommentModel.create(comment);
  return createdComment;
}

export async function findCommentById(commentId: Types.ObjectId) {
  const comment = await CommentModel.findOne({
    _id: commentId,
    active: true,
  });

  return comment;
}

type GetReactionQuery = {
  teacherId: Types.ObjectId;
  subjectId?: Types.ObjectId | null;
  userId: Types.ObjectId;
  limit: number;
  page: number;
};

export async function getReactions({
  subjectId,
  teacherId,
  userId,
  page,
  limit,
}: GetReactionQuery) {
  const filter: FilterQuery<AnyObject> = {
    teacher: teacherId,
  };

  if (subjectId) {
    filter.subject = subjectId;
  }

  const reactions = await CommentModel.commentsByReaction(
    filter,
    userId,
    ['enrollment', 'subject'],
    limit,
    page,
  );

  return reactions;
}

export async function createReaction(
  reaction: Omit<Reaction, 'createdAt' | 'updatedAt'>,
) {
  const createdReaction = await ReactionModel.create(reaction);
  return createdReaction;
}

export async function findReactionById(filter: FilterQuery<Reaction>) {
  const reaction = await ReactionModel.findOne(filter);
  return reaction;
}

export async function deleteReaction(commentId: Types.ObjectId) {
  const deletedReaction = await ReactionModel.deleteOne({ comment: commentId });
  return deletedReaction;
}
