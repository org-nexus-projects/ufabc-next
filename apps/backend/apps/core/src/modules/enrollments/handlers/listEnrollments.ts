import type { FastifyReply, FastifyRequest } from 'fastify';
import { EnrollmentModel } from '@ufabcnext/models';

export async function listEnrollments(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = request.user;

  if (!user?.ra) {
    return [];
  }

  const findEnrollmentQuery = {
    ra: user.ra,
    conceito: { $in: ['A', 'B', 'C', 'D', 'O', 'F'] },
  };

  const userEnrollments = await EnrollmentModel.find(findEnrollmentQuery)
    .populate(['pratica', 'teoria', 'subject'])
    .lean(true);

  return reply.status(200).send(userEnrollments);
}
