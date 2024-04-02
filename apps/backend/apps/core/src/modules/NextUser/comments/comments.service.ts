import type { Types } from 'mongoose';
import type { CommentRepository } from './comments.repository.js';
import type { Comment } from '@/models/Comment.js';
import type { Reaction } from '@/models/Reaction.js';

export class CommentService {
  constructor(private readonly commentRepository: CommentRepository) {}

  async findEnrollmentById(enrollmentId: Types.ObjectId) {
    const enrollment =
      await this.commentRepository.findEnrollmentById(enrollmentId);
    return enrollment;
  }

  async insertOneComment(data: Comment) {
    const createdComment = await this.commentRepository.insertOne(data);
    return createdComment;
  }

  async findOneComment(commentId: Types.ObjectId) {
    const comment = await this.commentRepository.findOne({
      _id: commentId,
      active: true,
    });

    return comment;
  }

  async findManyComments(ra: number, pojo?: boolean) {
    if (pojo) {
      const comments = await this.commentRepository.findMany(
        {
          ra,
        },
        pojo,
      );
      return comments;
    }
    const comments = await this.commentRepository.findMany({ ra });
    return comments;
  }

  async findEnrollment(ra: number) {
    const enrollment = await this.commentRepository.findEnrollment({ ra });
    return enrollment;
  }

  async commentsReactions(
    teacherId: string,
    subjectId: string,
    userId: Types.ObjectId,
    limit: number,
    page: number,
  ) {
    const comments = await this.commentRepository.fetchReactions(
      {
        teacher: teacherId,
        ...(subjectId && { subject: subjectId }),
      },
      userId,
      ['enrollment', 'subject'],
      limit,
      page,
    );

    return comments;
  }

  async createCommentReaction(reaction: Reaction) {
    const createdReaction =
      await this.commentRepository.insertOneReaction(reaction);

    return createdReaction;
  }

  async removeCommentReaction(commentId: Types.ObjectId) {
    const deletedReaction = await this.commentRepository.deleteOneReaction({
      comment: commentId,
    });

    return deletedReaction;
  }

  async findCommentReaction(filter: Reaction) {
    const reaction = await this.commentRepository.findOneReaction(filter);
    return reaction;
  }
}
