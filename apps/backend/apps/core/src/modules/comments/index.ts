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

export const autoPrefix = '/comments';
export default async function (app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.get<{ Params: CommentMissingParams }>('/:userId/missing', missingComment);
  app.get<TeacherCommentRequest>('/:teacherId', teacherComment);
  app.get<TeacherCommentRequest>('/:teacherId/:subjectId', teacherComment);
  app.post<{ Body: CreateCommentBody }>('', createComment);
  app.put<UpdateCommentRequest>('/:commentId', updateComment);
  app.delete<{ Params: DeleteCommentParams }>('/:commentId', deleteComment);
}
