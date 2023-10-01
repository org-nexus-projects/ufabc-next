import { CommentModel } from '@ufabcnext/models';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ObjectId } from 'mongoose';

export type DeleteCommentParams = { commentId: ObjectId };

export async function deleteComment(
  request: FastifyRequest<{ Params: DeleteCommentParams }>,
  reply: FastifyReply,
) {
  const { commentId } = request.params;

  if (!commentId) {
    request.log.warn({ params: request.params }, 'Missing commentId');
    // eslint-disable-next-line
    throw new Error(`CommentId was not passed`);
  }

  const comment = await CommentModel.findOne({ _id: commentId, active: true });

  if (!comment) {
    request.log.warn({ commentId }, 'CommentId');
    throw new Error(`Comment not found`);
  }

  comment.active = false;

  await comment.save();

  return reply.status(200).send(comment);
}
