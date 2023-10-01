import { CommentModel, EnrollmentModel } from '@ufabcnext/models';
import type { Comment } from '@ufabcnext/types';
import type { Enrollment } from '@ufabcnext/types';
import type { FastifyReply, FastifyRequest } from 'fastify';

export type CreateCommentBody = {
  enrollment: Enrollment;
  comment: Comment;
  type: string;
};

export async function createComment(
  request: FastifyRequest<{ Body: CreateCommentBody }>,
  reply: FastifyReply,
) {
  const { comment, enrollment, type } = request.body;

  if (!comment && !enrollment && !type) {
    request.log.error({ body: request.body }, 'Incomplete response');
    throw new Error(`Body must have all obligatory fields`);
  }

  const enrollmentExists = await EnrollmentModel.findById({ enrollment });

  if (!enrollmentExists) {
    // eslint-disable-next-line
    throw new Error(`This enrollment does not exists ${enrollment}`);
  }

  const createComment = {
    comment,
    type,
    // eslint-disable-next-line
    enrollment: enrollment.id,
    // eslint-disable-next-line
    teacher: enrollment[type],
    disciplina: enrollment.disciplina,
    subject: enrollment.subject,
    ra: enrollment.ra,
  };

  const insertedComment = await CommentModel.create(createComment);

  return reply.status(201).send(insertedComment);
}
