import { CommentModel } from '@next/models';
import type { FastifyReply, FastifyRequest } from 'fastify';

type TeacherCommentParams = {
  teacherId: string;
  subjectId: string;
};

type TeacherCommentQuery = {
  limit: number;
  page: number;
};

export type TeacherCommentRequest = {
  Params: TeacherCommentParams;
  Querystring: TeacherCommentQuery;
};

export async function teacherComment(
  request: FastifyRequest<TeacherCommentRequest>,
  reply: FastifyReply,
) {
  const { teacherId, subjectId } = request.params;
  // 10 per page
  const { limit = 10, page = 0 } = request.query;
  const userId = request.user?._id;

  if (!teacherId) {
    request.log.warn({ params: request.params }, 'Missing teacherId');
    throw new Error(`teacherId was not passed`);
  }
  if (!userId) {
    throw new Error(`Missing UserId: ${userId}`);
  }

  // Theres a very `Tricky` bug here
  const comment = await CommentModel.commentsByReaction(
    userId,
    ['enrollment', 'subject'],
    limit,
    page,
    {
      teacher: teacherId,
      ...(subjectId && { subject: subjectId }),
    },
  );

  return reply.status(200).send({
    data: comment.data,
    total: comment.total,
  });
}
