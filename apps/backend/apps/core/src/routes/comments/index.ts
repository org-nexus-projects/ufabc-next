import {
  missingCommentsSchema,
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
  commentsOnTeacherSchema,
  createReactionSchema,
  deleteReactionSchema,
} from '@/schemas/comments.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import {
  createReaction,
  deleteReaction,
  findById,
  findCommentById,
  findReactionById,
  getReactions,
  getUserComments,
  getUserEnrollments,
  insert,
} from './service.js';
import { Types } from 'mongoose';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get(
    '/:userId/missing',
    { schema: missingCommentsSchema },
    async (request, reply) => {
      const { userId } = request.params;

      if (!userId) {
        request.log.warn({ params: request.params }, 'Missing userId');
        return reply.badRequest('userId was not passed');
      }
      const user = request.user._id === userId.toString() ? request.user : null;

      if (!user) {
        return reply.badRequest(`Invalid User: ${userId}`);
      }

      const enrollments = await getUserEnrollments(user.ra);
      const comments = await getUserComments(user.ra);
      const enrollmentsFromComments = comments.map((comment) =>
        comment.enrollment.toString(),
      );
      const enrollmentsToComment = [];
      for (const enrollment of enrollments) {
        if (!enrollmentsFromComments.includes(enrollment._id.toString())) {
          enrollmentsToComment.push(enrollment);
        }
      }

      return enrollmentsToComment;
    },
  );

  app.post('/', { schema: createCommentSchema }, async (request, reply) => {
    const { enrollment: enrollmentId, comment, type } = request.body;

    if (!comment || !enrollmentId || !type) {
      return reply.badRequest('Body must have all obligatory fields');
    }

    const enrollment = await findById(enrollmentId);

    if (!enrollment) {
      return reply.notFound('Enrollment not found');
    }

    if (!enrollment.subject || !enrollment.ra) {
      request.log.warn(
        {
          enrollment,
          ra: request.user.ra,
        },
        'This should not happen',
      );
      return reply.badRequest('Malformed enrollment, cannot comment');
    }

    const createdComment = await insert({
      comment,
      type,
      enrollment: enrollment._id,
      subject: enrollment.subject,
      ra: enrollment.ra.toString(),
    });

    return createdComment;
  });

  app.put(
    '/:commentId',
    { schema: updateCommentSchema },
    async (request, reply) => {
      const { commentId } = request.params;

      if (!commentId) {
        request.log.warn({ params: request.params }, 'Missing commentId');
        return reply.badRequest('CommentId was not passed');
      }

      const comment = await findCommentById(commentId);

      if (!comment) {
        request.log.warn(comment, 'Comment missing');
        return reply.notFound('Comment not found');
      }

      comment.comment = request.body.comment;

      await comment.save();

      return comment;
    },
  );

  app.delete(
    '/:commentId',
    { schema: deleteCommentSchema },
    async (request, reply) => {
      const { commentId } = request.params;

      if (!commentId) {
        request.log.warn({ params: request.params }, 'Missing commentId');
        return reply.badRequest('CommentId was not passed');
      }

      const comment = await findCommentById(commentId);

      if (!comment) {
        request.log.warn(comment, 'Comment not found');
        return reply.notFound('Comment not found');
      }

      comment.active = false;

      await comment.save();

      return comment;
    },
  );

  app.get(
    '/:teacherId',
    { schema: commentsOnTeacherSchema },
    async (request, reply) => {
      const { teacherId } = request.params;
      const { limit, page } = request.query;

      if (!teacherId) {
        request.log.warn({ params: request.params }, 'Missing teacherId');
        return reply.badRequest('teacherId was not passed');
      }

      const { data, total } = await getReactions({
        teacherId,
        userId: new Types.ObjectId(request.user._id),
        limit,
        page,
      });

      return {
        data,
        total,
      };
    },
  );

  app.get(
    '/:teacherId/:subjectId',
    { schema: commentsOnTeacherSchema },
    async (request, reply) => {
      const { teacherId, subjectId } = request.params;
      const { limit, page } = request.query;

      if (!teacherId) {
        request.log.warn({ params: request.params }, 'Missing teacherId');
        return reply.badRequest('teacherId was not passed');
      }

      const { data, total } = await getReactions({
        teacherId,
        subjectId,
        userId: new Types.ObjectId(request.user._id),
        limit,
        page,
      });

      return {
        data,
        total,
      };
    },
  );

  app.post(
    '/reactions/:commentId',
    { schema: createReactionSchema },
    async (request, reply) => {
      const { commentId } = request.params;
      const { kind } = request.body;
      const user = request.user;

      if (!user) {
        return reply.unauthorized('Must be logged');
      }

      if (!commentId) {
        return reply.badRequest('CommentId was not passed');
      }

      const comment = await findCommentById(commentId);

      if (!comment) {
        return reply.notFound('Comment not found');
      }

      const reaction = await createReaction({
        kind,
        comment: comment._id,
        user: new Types.ObjectId(user?._id),
        active: true,
      });

      return reaction;
    },
  );

  app.delete(
    '/reactions/:commentId/:kind',
    { schema: deleteReactionSchema },
    async (request, reply) => {
      const { commentId, kind } = request.params;
      if (!commentId && !kind) {
        return reply.badRequest('CommentId and Kind are necessary');
      }

      const reaction = await findReactionById({
        active: true,
        user: request.user._id,
        comment: commentId,
        kind,
      });

      if (!reaction) {
        return reply.notFound(
          `Reação não encontrada no comentário: ${commentId}`,
        );
      }

      await deleteReaction(commentId);

      return { status: 'ok' };
    },
  );
};

export default plugin;
