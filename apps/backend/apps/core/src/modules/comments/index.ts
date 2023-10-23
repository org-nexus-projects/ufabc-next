import { authenticate } from '@/modules/user/hooks/authenticate.js';
import {
  type DeleteCommentParams,
  deleteComment,
} from './handlers/deleteComment.js';
import {
  type UpdateCommentRequest,
  updateComment,
} from './handlers/updateComment.js';
import {
  type CommentMissingParams,
  missingComment,
} from './handlers/missingComment.js';
import {
  type TeacherCommentRequest,
  teacherComment,
} from './handlers/teacherComment.js';
import {
  type CreateCommentBody,
  createComment,
} from './handlers/createComment.js';
import type { FastifyInstance } from 'fastify';

export const autoPrefix = '/comments';
// eslint-disable-next-line require-await
export default async function (app: FastifyInstance) {
  app.addHook('onRequest', authenticate);
  app.get<{ Params: CommentMissingParams }>('/:userId/missing', missingComment);
  app.get<TeacherCommentRequest>('/:teacherId', teacherComment);
  app.get<TeacherCommentRequest>('/:teacherId/:subjectId', teacherComment);
  app.post<{ Body: CreateCommentBody }>('/', createComment);
  app.put<UpdateCommentRequest>('/:commentId', updateComment);
  app.delete<{ Params: DeleteCommentParams }>('/:commentId', deleteComment);
}
