import type { Comment } from '@/models/Comment.js';
import type { CommentService } from './comments.service.js';
import type { Types } from 'mongoose';
import type { FastifyReply, FastifyRequest } from 'fastify';

export type CommentsOnTeacherRequest = {
  Params: {
    teacherId: string;
    subjectId: string;
  };
  Querystring: {
    limit: number;
    page: number;
  };
};

export type CreateCommentRequest = {
  Body: {
    enrollmentId: Types.ObjectId;
    comment: string;
    type: Comment['type'];
  };
};

export type UpdateCommentRequest = {
  Body: { comment: string };
  Params: { commentId: Types.ObjectId };
};

export class CommentHandler {
  constructor(private readonly commentService: CommentService) {}

  async createComment(
    request: FastifyRequest<CreateCommentRequest>,
    reply: FastifyReply,
  ) {
    const { enrollmentId, comment, type } = request.body;

    if (!comment && !enrollmentId && !type) {
      request.log.error({ body: request.body }, 'Incomplete response');
      return reply.badRequest(`Body must have all obligatory fields`);
    }

    const enrollment =
      await this.commentService.findEnrollmentById(enrollmentId);

    if (!enrollment) {
      return reply.notFound('Enrollment not found');
    }

    request.log.warn(enrollment.mainTeacher);

    const createdComment = await this.commentService.insertOneComment({
      comment,
      type,
      enrollment: enrollment._id,
      // @ts-expect-error mongoose
      teacher: enrollment[type],
      // @ts-expect-error mongoose
      subject: enrollment.subject,
      // @ts-expect-error mongoose
      ra: enrollment.ra,
    });

    return createdComment;
  }

  async updateComment(
    request: FastifyRequest<UpdateCommentRequest>,
    reply: FastifyReply,
  ) {
    const { commentId } = request.params;

    if (!commentId) {
      request.log.warn({ params: request.params }, 'Missing commentId');
      return reply.badRequest(`CommentId was not passed`);
    }

    const comment = await this.commentService.findOneComment(commentId);

    if (!comment) {
      request.log.warn(comment, 'Comment missing');
      return reply.notFound(`Comment not found`);
    }

    comment.comment = request.body.comment;

    await comment.save();

    return comment;
  }

  async deleteComment(
    request: FastifyRequest<{ Params: { commentId: Types.ObjectId } }>,
    reply: FastifyReply,
  ) {
    const { commentId } = request.params;

    if (!commentId) {
      request.log.warn({ params: request.params }, 'Missing commentId');
      return reply.badRequest(`CommentId was not passed`);
    }

    const comment = await this.commentService.findOneComment(commentId);

    if (!comment) {
      request.log.warn(comment, 'Comment not found');
      return reply.notFound(`Comment not found`);
    }

    comment.active = false;

    await comment.save();

    return comment;
  }

  async missingComment(
    request: FastifyRequest<{ Params: { userId: Types.ObjectId } }>,
    reply: FastifyReply,
  ) {
    const { userId } = request.params;

    if (!userId) {
      request.log.warn({ params: request.params }, 'Missing userId');
      throw new Error(`userId was not passed`);
    }

    const user = request.user?.id === userId ? request.user : null;

    if (!user) {
      return reply.badRequest(`Invalid User: ${userId}`);
    }

    const enrollments = await this.commentService.findEnrollment(user?.ra);
    const comments = await this.commentService.findManyComments(user?.ra, true);
    const enrollmentsFromComments = comments.map(
      (comment) => comment.enrollment,
    );
    const enrollmentsToComment = [];

    for (const enrollment of enrollments) {
      if (!enrollmentsFromComments.includes(enrollment.id)) {
        enrollmentsToComment.push(enrollment);
      }
    }

    return enrollmentsToComment;
  }

  async commentsOnTeacher(
    request: FastifyRequest<CommentsOnTeacherRequest>,
    reply: FastifyReply,
  ) {
    const { teacherId, subjectId } = request.params;
    // 10 per page
    const { limit = 10, page = 0 } = request.query;
    const userId = request.user?._id;

    if (!teacherId) {
      request.log.warn({ params: request.params }, 'Missing teacherId');
      return reply.badRequest(`teacherId was not passed`);
    }
    if (!userId) {
      return reply.badRequest(`Missing UserId: ${userId}`);
    }

    const comments = await this.commentService.commentsReactions(
      teacherId,
      subjectId,
      userId,
      limit,
      page,
    );

    return {
      data: comments.data,
      total: comments.total,
    };
  }
}
