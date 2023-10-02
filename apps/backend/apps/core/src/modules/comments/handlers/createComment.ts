import { CommentModel, EnrollmentModel } from '@ufabcnext/models';
import type { Comment } from '@ufabcnext/types';
import type { Enrollment } from '@ufabcnext/types';
import type { FastifyReply, FastifyRequest } from 'fastify';

export type CreateCommentBody = {
  enrollment: Enrollment;
  comment: Comment;
  type: 'teoria' | 'pratica';
};

export async function createComment(
  request: FastifyRequest<{ Body: CreateCommentBody }>,
  reply: FastifyReply,
) {
  const { enrollment, comment, type } = request.body;

  if (!comment && !enrollment && !type) {
    request.log.error({ body: request.body }, 'Incomplete response');
    throw new Error(`Body must have all obligatory fields`);
  }

  // eslint-disable-next-line
  const enrollmentExists = await EnrollmentModel.findById({
    enrollment,
  });

  if (!enrollmentExists) {
    // eslint-disable-next-line
    throw new Error(`This enrollment does not exists ${enrollment}`);
  }

  const createComment = {
    comment,
    type,
    enrollment: enrollment.id,
    teacher: enrollment[type],
    disciplina: enrollment.disciplina,
    subject: enrollment.subject,
    ra: enrollment.ra,
  };

  // eslint-disable-next-line
  const insertedComment = new CommentModel(createComment).save();

  return reply.status(201).send(insertedComment);
}
