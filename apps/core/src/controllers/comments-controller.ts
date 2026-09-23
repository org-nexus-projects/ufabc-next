import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { legacyJwtHook } from '@/hooks/legacy-auth.js';
import type { Reaction } from '@/models/Reaction.js';
import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import {
  addReaction,
  createComment,
  deleteComment,
  listMissingComments,
  listTeacherComments,
  removeReaction,
  updateComment,
} from '@/routes/comments/service.js';
import {
  addReactionSchema,
  commentsOnTeacherSchema,
  createCommentSchema,
  deleteCommentSchema,
  missingCommentsSchema,
  removeReactionSchema,
  updateCommentSchema,
} from '@/schemas/comments.js';

const tags = ['Comments'];

const commentsRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await listMissingComments(request.user, request.params, request.log)),
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      params: missingCommentsSchema.params,
      response: {
        200: missingCommentsSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/:userId/missing',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await createComment(request.user, request.body, request.log)),
    method: 'POST',
    onRequest: legacyJwtHook,
    schema: {
      body: createCommentSchema.body,
      response: {
        200: createCommentSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await updateComment(
        request.user,
        request.params,
        request.body.comment,
        request.log
      )),
    method: 'PUT',
    onRequest: legacyJwtHook,
    schema: {
      body: updateCommentSchema.body,
      params: updateCommentSchema.params,
      response: {
        200: updateCommentSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/:commentId',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await deleteComment(request.user, request.params, request.log)),
    method: 'DELETE',
    onRequest: legacyJwtHook,
    schema: {
      params: deleteCommentSchema.params,
      response: {
        200: deleteCommentSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/:commentId',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await listTeacherComments(
        request.user,
        { teacherId: request.params.teacherId },
        request.query,
        request.log
      )),
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      params: commentsOnTeacherSchema.params,
      querystring: commentsOnTeacherSchema.querystring,
      tags,
    },
    url: '/:teacherId',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await listTeacherComments(
        request.user,
        request.params,
        request.query,
        request.log
      )),
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      params: commentsOnTeacherSchema.params,
      querystring: commentsOnTeacherSchema.querystring,
      tags,
    },
    url: '/:teacherId/:subjectId',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { commentId } = request.params as { commentId: string };
      const { kind } = request.body as { kind: Reaction['kind'] };

      return await reply.status(200).send(await addReaction(request.user, commentId, kind));
    },
    method: 'POST',
    onRequest: legacyJwtHook,
    schema: {
      body: addReactionSchema.body,
      params: addReactionSchema.params,
      tags,
    },
    url: '/reactions/:commentId',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { commentId, kind } = request.params as {
        commentId: string;
        kind: Reaction['kind'];
      };

      return await reply.status(200).send(await removeReaction(request.user, commentId, kind));
    },
    method: 'DELETE',
    onRequest: legacyJwtHook,
    schema: {
      params: removeReactionSchema.params,
      tags,
    },
    url: '/reactions/:commentId/:kind',
  });
};

export const commentsController: FastifyPluginAsyncZod = async (app) => {
  await app.register(commentsRoutes, { prefix: '/comments' });
};
