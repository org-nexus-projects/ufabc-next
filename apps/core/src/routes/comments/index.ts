import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import type { Reaction } from '@/models/Reaction.js';

import {
  missingCommentsSchema,
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
  commentsOnTeacherSchema,
} from '@/schemas/comments.js';

import {
  addReaction,
  createComment,
  deleteComment,
  listMissingComments,
  listTeacherComments,
  removeReaction,
  updateComment,
} from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get(
    '/:userId/missing',
    { schema: missingCommentsSchema },
    async (request) =>
      listMissingComments(request.user, request.params, request.log)
  );

  app.post('/', { schema: createCommentSchema }, async (request) =>
    createComment(request.user, request.body, request.log)
  );

  app.put('/:commentId', { schema: updateCommentSchema }, async (request) =>
    updateComment(
      request.user,
      request.params,
      request.body.comment,
      request.log
    )
  );

  app.delete(
    '/:commentId',
    { schema: deleteCommentSchema },
    async (request) =>
      deleteComment(request.user, request.params, request.log)
  );

  app.get(
    '/:teacherId',
    { schema: commentsOnTeacherSchema },
    async (request) =>
      listTeacherComments(
        request.user,
        { teacherId: request.params.teacherId },
        request.query,
        request.log
      )
  );

  app.get(
    '/:teacherId/:subjectId',
    { schema: commentsOnTeacherSchema },
    async (request) =>
      listTeacherComments(
        request.user,
        request.params,
        request.query,
        request.log
      )
  );

  app.post(
    '/reactions/:commentId',
    // { schema: createReactionSchema },
    async (request) => {
      const { commentId } = request.params as { commentId: string };
      const { kind } = request.body as { kind: Reaction['kind'] };

      return addReaction(request.user, commentId, kind);
    }
  );

  app.delete(
    '/reactions/:commentId/:kind',
    // { schema: deleteReactionSchema },
    async (request) => {
      const { commentId, kind } = request.params as {
        commentId: string;
        kind: Reaction['kind'];
      };

      return removeReaction(request.user, commentId, kind);
    }
  );
};

export default plugin;
