import { type Reaction, ReactionModel } from '@next/models';
import type { ObjectId } from 'mongoose';
import type { RouteHandler } from 'fastify';

type CreateReactionRequest = {
  Params: {
    commentId: ObjectId;
    kind: Reaction['kind'];
  };
};

export const removeComment: RouteHandler<CreateReactionRequest> = async (
  request,
  reply,
) => {
  const user = request.user;
  const { commentId, kind } = request.params;
  const reaction = await ReactionModel.findOne({
    comment: commentId,
    kind,
    user: user?._id,
    active: true,
  }).lean(true);

  if (!reaction) {
    throw new Error(`Reação não encontrada no comentário: ${commentId}`);
  }

  // TODO: validate here
  await reaction.remove();
  reply.send();
};
