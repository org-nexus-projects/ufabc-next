// import { authenticate } from '@/hooks/authenticate.js';
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
import {
  commentsOnTeacherSchema,
  createCommentReactionSchema,
  createCommentSchema,
  deleteCommentSchema,
  missingCommentSchema,
  removeCommentReactionSchema,
  updateCommentSchema,
} from './comments.schema.js';
import { CommentService } from './comments.service.js';
import type { Types } from 'mongoose';
import type { FastifyInstance } from 'fastify';

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
    { schema: createCommentSchema },
    commentHandler.createComment,
  );

  app.put<UpdateCommentRequest>(
    '/:commentId',
    { schema: updateCommentSchema },
    commentHandler.updateComment,
  );

  app.delete<{ Params: { commentId: Types.ObjectId } }>(
    '/:commentId',
    { schema: deleteCommentSchema },
    commentHandler.deleteComment,
  );

  app.get<{ Params: { userId: Types.ObjectId } }>(
    '/:userId/missing',
    { schema: missingCommentSchema },
    commentHandler.missingComment,
  );

  app.get<CommentsOnTeacherRequest>(
    '/:teacherId/:subjectId',
    { schema: commentsOnTeacherSchema },
    commentHandler.commentsOnTeacher,
  );

  app.post<CreateCommentReaction>(
    '/reactions/:commentId',
    { schema: createCommentReactionSchema },
    commentHandler.createCommentReaction,
  );

  app.delete<{
    Params: { commentId: Types.ObjectId; kind: Reaction['kind'] };
  }>(
    '/reactions/:commentId/:kind',
    { schema: removeCommentReactionSchema },
    commentHandler.removeCommentReaction,
  );
}
