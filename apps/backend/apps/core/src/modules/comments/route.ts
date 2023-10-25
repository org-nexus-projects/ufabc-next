import { deleteComment } from './handlers/deleteComment.js';
import { updateComment } from './handlers/updateComment.js';
import { missingComment } from './handlers/missingComment.js';
import { teacherComment } from './handlers/teacherComment.js';
import { createComment } from './handlers/createComment.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function commentsRoute(app: FastifyInstance) {
  app.post('/', createComment);
  app.get('/:userId/missing', missingComment);
  app.get('/:teacherId', teacherComment);
  app.get('/:teacherId/:subjectId', teacherComment);
  app.put('/:commentId', updateComment);
  app.delete('/:commentId', deleteComment);
}
