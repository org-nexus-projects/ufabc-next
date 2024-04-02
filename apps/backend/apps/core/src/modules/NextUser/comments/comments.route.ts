import { authenticate } from '@/hooks/authenticate.js';
import { CommentModel } from '@/models/Comment.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import { type Reaction, ReactionModel } from '@/models/Reaction.js';
import {
  CommentHandler,
  type CommentsOnTeacherRequest,
  type CreateCommentReaction,
  type CreateCommentRequest,
  type UpdateCommentRequest,
} from './comments.handlers.js';
import { CommentRepository } from './comments.repository.js';
import { CommentService } from './comments.service.js';
import type { FastifyInstance } from 'fastify';
import type { Types } from 'mongoose';

// eslint-disable-next-line require-await
export async function commentRoute(app: FastifyInstance) {
  const commentRepository = new CommentRepository(
    CommentModel,
    EnrollmentModel,
    ReactionModel,
  );
  const commentService = new CommentService(commentRepository);
  app.decorate('commentService', commentService);
  const commentHandler = new CommentHandler(commentService);

  app.post<CreateCommentRequest>(
    '/',
    { onRequest: [authenticate] },
    commentHandler.createComment,
  );

  app.put<UpdateCommentRequest>(
    '/:commentId',
    { onRequest: [authenticate] },
    commentHandler.updateComment,
  );

  app.delete<{ Params: { commentId: Types.ObjectId } }>(
    '/:commentId',
    { onRequest: [authenticate] },
    commentHandler.deleteComment,
  );

  app.get<{ Params: { userId: Types.ObjectId } }>(
    '/:userId/missing',
    { onRequest: [authenticate] },
    commentHandler.missingComment,
  );

  app.get<CommentsOnTeacherRequest>(
    '/:teacherId/:subjectId',
    { onRequest: [authenticate] },
    commentHandler.commentsOnTeacher,
  );

  app.post<CreateCommentReaction>(
    '/reaction/:commentId',
    { onRequest: [authenticate] },
    commentHandler.createCommentReaction,
  );

  app.delete<{
    Params: { commentId: Types.ObjectId; kind: Reaction['kind'] };
  }>(
    '/reaction/:commentId/:kind',
    { onRequest: [authenticate] },
    commentHandler.removeCommentReaction,
  );
}
