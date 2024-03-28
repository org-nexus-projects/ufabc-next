import { CommentModel } from '@/models/Comment.js';
import { authenticate } from '@/hooks/authenticate.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import { CommentRepository } from './comments.repository.js';
import { CommentService } from './comments.service.js';
import {
  CommentHandler,
  type CreateCommentRequest,
  type UpdateCommentRequest,
} from './comments.handlers.js';
import type { FastifyInstance } from 'fastify';
import type { Types } from 'mongoose';

// eslint-disable-next-line require-await
export async function commentRoute(app: FastifyInstance) {
  const commentRepository = new CommentRepository(
    CommentModel,
    EnrollmentModel,
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
}
