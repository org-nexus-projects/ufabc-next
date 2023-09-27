import { CommentModel, EnrollmentModel, UserModel } from '@ufabcnext/models';
import type { FastifyReply, FastifyRequest } from 'fastify';

export type CommentMissingParams = {
  userId: string;
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
    // TODO: fix this type
    // eslint-disable-next-line
    if (!commentsInEnrollment.includes(enrollment.id)) {
      enrollmentsToComment.push(enrollment);
    }
  }

  return reply.code(200).send(enrollmentsToComment);
}
