import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { Types } from 'mongoose';

import { JOB_NAMES } from '@/constants.js';
import {
  createCommentSchema,
  updateCommentSchema,
  commentsOnTeacherSchema,
} from '@/schemas/comments.js';

import {
  createReaction,
  deleteReaction,
  findById,
  findCommentById,
  findReactionById,
  getReactions,
  insert,
} from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post('/', { schema: createCommentSchema }, async (request, reply) => {
    const { enrollment: enrollmentId, comment, type } = request.body;
    const user = request.user;

    if (!comment || !enrollmentId || !type) {
      return reply.badRequest('Body must have all obligatory fields');
    }

    const enrollment = await findById(enrollmentId);

    if (!enrollment) {
      return reply.notFound('Enrollment not found');
    }

    if (Number(user.ra) !== Number(enrollment.ra)) {
      request.log.warn(
        { userRa: user.ra, commentRa: enrollment.ra },
        'Unauthorized comment creation attempt'
      );
      return reply.forbidden();
    }

    if (!enrollment.subject || !enrollment.ra) {
      request.log.warn(
        {
          enrollment,
          ra: request.user.ra,
        },
        'This should not happen'
      );
      return reply.badRequest('Malformed enrollment, cannot comment');
    }

    const createdComment = await insert({
      comment,
      type,
      enrollment: enrollment._id,
      // @ts-ignore for nwo
      teacher: enrollment[type],
      subject: enrollment.subject,
      ra: enrollment.ra.toString(),
    });

    // @ts-ignore teacher is the dynamic enrollment[type] field
    const teacherId = createdComment.teacher?.toString();
    if (teacherId) {
      await app.manager.dispatch(JOB_NAMES.TEACHER_COMMENT_CREATED, {
        teacherId,
      });
    }

    return createdComment;
  });

  app.put(
    '/:commentId',
    { schema: updateCommentSchema },
    async (request, reply) => {
      const { commentId } = request.params;
      const user = request.user;

      if (!commentId) {
        request.log.warn({ params: request.params }, 'Missing commentId');
        return reply.badRequest('CommentId was not passed');
      }

      const comment = await findCommentById(commentId);

      if (!comment) {
        request.log.warn(comment, 'Comment missing');
        return reply.notFound('Comment not found');
      }

      if (Number(user.ra) !== Number(comment.ra)) {
        request.log.warn(
          { userRa: user.ra, commentRa: comment.ra },
          'Unauthorized comment update attempt'
        );
        return reply.forbidden();
      }

      comment.comment = request.body.comment;

      await comment.save();

      return comment;
    }
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
    }
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
    }
  );

  app.post(
    '/reactions/:commentId',
    // { schema: createReactionSchema },
    async (request, reply) => {
      // @ts-ignore
      const { commentId } = request.params;
      // @ts-ignore
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
    }
  );

  app.delete(
    '/reactions/:commentId/:kind',
    // { schema: deleteReactionSchema },
    async (request, reply) => {
      // @ts-ignore
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
          `Reação não encontrada no comentário: ${commentId}`
        );
      }

      await deleteReaction(commentId);

      return { status: 'ok' };
    }
  );
};

export default plugin;
