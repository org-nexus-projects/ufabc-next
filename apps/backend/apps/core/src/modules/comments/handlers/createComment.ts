import {
  type Comment,
  CommentModel,
  type Enrollment,
  EnrollmentModel,
} from '@/models/index.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export type CreateCommentBody = {
  enrollment: Enrollment;
  comment: Comment;
  type: Comment['type'];
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

  const enrollmentExists = await EnrollmentModel.findById(enrollment);

  if (!enrollmentExists) {
    throw new Error(`This enrollment does not exists ${enrollment}`);
  }

  const insertedComment = await CommentModel.create({
    comment,
    type,
    enrollment: enrollmentExists._id,
    teacher: enrollmentExists[type],
    subject: enrollmentExists.subject,
    ra: enrollmentExists.ra,
  });

  return reply.status(201).send(insertedComment);
}
