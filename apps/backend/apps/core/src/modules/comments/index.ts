import type { FastifyInstance } from 'fastify';
import {
  deleteComment,
  type DeleteCommentParams,
} from './handlers/deleteComment';
import {
  updateComment,
  type UpdateCommentRequest,
} from './handlers/updateComment';
import {
  missingComment,
  type CommentMissingParams,
} from './handlers/missingComment';
import {
  teacherComment,
  type TeacherCommentRequest,
} from './handlers/teacherComment';

export const autoPrefix = '/v2';
export default async function (app: FastifyInstance) {
  app.get<{ Params: CommentMissingParams }>(
    '/comments/:userId/missing',
    missingComment,
  );
  app.get<TeacherCommentRequest>('/comments/:teacherId', teacherComment);
  app.get<TeacherCommentRequest>(
    '/comments/:teacherId/:subjectId',
    teacherComment,
  );
  app.put<UpdateCommentRequest>('/comments/:commentId', updateComment);
  app.delete<{ Params: DeleteCommentParams }>(
    '/comments/:commentId',
    deleteComment,
  );
}
