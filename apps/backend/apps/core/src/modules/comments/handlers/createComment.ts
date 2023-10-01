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
  const t = request.body;

  if (!t.comment && !t.enrollment && !t.type) {
    request.log.error({ body: request.body }, 'Incomplete response');
    throw new Error(`Body must have all obligatory fields`);
  }

  const enrollmentExists = await EnrollmentModel.findById({
    enrollment: t.enrollment,
  });

  if (!enrollmentExists) {
    // eslint-disable-next-line
    throw new Error(`This enrollment does not exists ${t.enrollment}`);
  }

  const createComment = {
    comment: t.comment,
    type: t.type,
    // eslint-disable-next-line
    enrollment: t.enrollment.id,
    // eslint-disable-next-line
    teacher: t.enrollment[t.type],
    disciplina: t.enrollment.disciplina,
    subject: t.enrollment.subject,
    ra: t.enrollment.ra,
  };

  const insertedComment = await CommentModel.create(createComment);

  return reply.status(201).send(insertedComment);
}
