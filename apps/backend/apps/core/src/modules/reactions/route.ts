import { createReaction } from './handlers/create-reaction.js';
import { removeComment } from './handlers/remove-comment.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function reactionRoute(app: FastifyInstance) {
  app.post('/:commentId', createReaction);
  app.delete('/:commentId/:kind', removeComment);
}
