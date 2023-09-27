import type { FastifyInstance } from 'fastify';
import { deleteComment } from './handlers/deleteComment';
import {
  updateComment,
  type RouteBody,
  type RouteParams,
} from './handlers/updateComment';

export const autoPrefix = '/v2';
export default async function (app: FastifyInstance) {
  app.delete<{ Params: RouteParams }>('/comments/:commentId', deleteComment);
  app.put<{ Params: RouteParams; Body: RouteBody }>(
    '/comments/:commentId',
    updateComment,
  );
}
