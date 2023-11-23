import { CommentModel, type Reaction, ReactionModel } from '@next/models';
import type { ObjectId } from 'mongoose';
import type { RouteHandler } from 'fastify';

type CreateReactionRequest = {
  Body: {
    kind: Reaction['kind'];
  };
  Params: {
    commentId: ObjectId;
  };
};

export const createReaction: RouteHandler<CreateReactionRequest> = async (
  request,
  reply,
) => {
  const { commentId } = request.params;

  if (!commentId) {
    throw new Error('CommentId was not passed');
  }

  const user = request.user;
  const { kind } = request.body;

  if (!kind) {
    throw new Error('Please, provide the kind of the comment');
  }

  const comment = await CommentModel.findOne({
    _id: commentId,
    active: true,
  }).lean(true);

  if (!comment) {
    throw new Error(`Invalid comment ${commentId}`);
  }

  const reaction = await ReactionModel.create({ kind, comment, user });

  return reply.status(201).send(reaction);
};
