import { CommentModel, EnrollmentModel } from '@next/models';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ObjectId } from 'mongoose';

export type RouteParams = { enrollmentId: ObjectId };
export async function enrollment(
  request: FastifyRequest<{ Params: RouteParams }>,
  reply: FastifyReply,
) {
  const { enrollmentId } = request.params;
  const user = request.user;

  if (!user?.ra) {
    return {};
  }

  if (!enrollmentId) {
    request.log.error({ params: request.params }, 'Route params');
    throw new Error('Missing enrollmentId');
  }

  const enrollment = await EnrollmentModel.findOne({
    _id: enrollmentId,
  })
    .populate(['pratica', 'teoria', 'subject'])
    .lean(true);

  const comments = await CommentModel.findOne({ enrollment: enrollmentId });
  return reply.code(200).send({ enrollment, comments });
}
