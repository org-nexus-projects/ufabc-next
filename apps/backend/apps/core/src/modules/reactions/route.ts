import { createReaction } from './handlers/create-reaction.js';
import { removeReaction } from './handlers/remove-reaction.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function reactionRoute(app: FastifyInstance) {
  app.post('/:commentId', createReaction);
  app.delete('/:commentId/:kind', removeReaction);
}
