import { type Reaction, ReactionModel } from '@/models/index.js';
import type { ObjectId } from 'mongoose';
import type { RouteHandler } from 'fastify';

type CreateReactionRequest = {
  Params: {
    commentId: ObjectId;
    kind: Reaction['kind'];
  };
};

export const removeReaction: RouteHandler<CreateReactionRequest> = async (
  request,
  reply,
) => {
  const user = request.user;
  const { commentId, kind } = request.params;
  if (!commentId && !kind) {
    throw new Error('CommentId and Kind are necessary');
  }
  const reaction = await ReactionModel.findOne({
    comment: commentId,
    kind,
    user: user?._id,
    active: true,
  });

  request.log.info(reaction);

  if (!reaction) {
    throw new Error(`Reação não encontrada no comentário: ${commentId}`);
  }

  await reaction.deleteOne({
    comment: commentId,
  });

  reply.send();
};
