import { CommentModel } from '@ufabcnext/models';
import type { FastifyReply, FastifyRequest } from 'fastify';
/* eslint @typescript-eslint/no-unsafe-assignment: 0 */
/* eslint @typescript-eslint/no-unsafe-member-access: 0 */

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
  // 10 per page, starting from 0
  const { limit = 10, page = 0 } = request.query;
  const userId = request.user?._id;

  if (!teacherId) {
    request.log.warn({ params: request.params }, 'Missing teacherId');
    throw new Error(`teacherId was not passed`);
  }
  if (!userId) {
    throw new Error(`Missing UserId: ${userId}`);
  }

  // Todo: Fix this later
  // eslint-disable-next-line
  const comment = await CommentModel.commentsByReactions(
    {
      teacher: teacherId,
      ...(subjectId && { subject: subjectId }),
      userId,
    },
    ['enrollment', 'subject'],
    limit,
    page,
  );

  return reply.status(200).send({
    data: comment.data,
    total: comment.total,
  });
}
