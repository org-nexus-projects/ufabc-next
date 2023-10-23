import { CommentModel, EnrollmentModel, UserModel } from '@next/models';
import type { Types } from 'mongoose';
import type { FastifyReply, FastifyRequest } from 'fastify';

export type CommentMissingParams = {
  userId: Types.ObjectId;
};

export async function missingComment(
  request: FastifyRequest<{ Params: CommentMissingParams }>,
  reply: FastifyReply,
) {
  const { userId } = request.params;

  if (!userId) {
    request.log.warn({ params: request.params }, 'Missing userId');
    throw new Error(`userId was not passed`);
  }

  const user = await UserModel.findOne({ _id: userId, active: true });

  if (!user) {
    throw new Error(`Invalid User: ${userId}`);
  }

  const enrollments = await EnrollmentModel.find({ ra: user.ra });
  const comments = await CommentModel.find({ ra: user.ra }).lean(true);
  const commentsInEnrollment = comments.map((comment) => comment.enrollment);
  const enrollmentsToComment = [];

  for (const enrollment of enrollments) {
    if (!commentsInEnrollment.includes(enrollment.id)) {
      enrollmentsToComment.push(enrollment);
    }
  }

  return reply.code(200).send(enrollmentsToComment);
}
