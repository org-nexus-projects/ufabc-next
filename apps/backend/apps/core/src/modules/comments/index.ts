import type { FastifyInstance } from 'fastify';
import {
  deleteComment,
  type DeleteCommentParams,
} from './handlers/deleteComment.js';
import {
  updateComment,
  type UpdateCommentRequest,
} from './handlers/updateComment.js';
import {
  missingComment,
  type CommentMissingParams,
} from './handlers/missingComment.js';
import {
  teacherComment,
  type TeacherCommentRequest,
} from './handlers/teacherComment.js';
import {
  createComment,
  type CreateCommentBody,
} from './handlers/createComment.js';
import { authenticate } from '@/modules/user/hooks/authenticate.js';

export const autoPrefix = '/v2';
export default async function (app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.get<{ Params: CommentMissingParams }>(
    '/comments/:userId/missing',
    missingComment,
  );
  app.get<TeacherCommentRequest>('/comments/:teacherId', teacherComment);
  app.get<TeacherCommentRequest>(
    '/comments/:teacherId/:subjectId',
    teacherComment,
  );
  app.post<{ Body: CreateCommentBody }>('/comments', createComment);
  app.put<UpdateCommentRequest>('/comments/:commentId', updateComment);
  app.delete<{ Params: DeleteCommentParams }>(
    '/comments/:commentId',
    deleteComment,
  );
}
