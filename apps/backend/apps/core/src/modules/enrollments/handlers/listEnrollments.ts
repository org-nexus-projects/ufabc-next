import { EnrollmentModel } from '@next/models';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function listEnrollments(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = request.user;

  if (!user?.ra) {
    return [];
  }

  const userEnrollments = await EnrollmentModel.find({
    ra: user.ra,
    conceito: { $in: ['A', 'B', 'C', 'D', 'O', 'F'] },
  })
    .populate(['pratica', 'teoria', 'subject'])
    .lean(true);

  return reply.status(200).send(userEnrollments);
}
