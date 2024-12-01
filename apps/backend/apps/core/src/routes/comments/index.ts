import { missingCommentsSchema, createCommentSchema, updateCommentSchema, deleteCommentSchema } from "@/schemas/comments.js";
import { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import { findById, findCommentById, getUserComments, getUserEnrollments, insert } from "./service.js";

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
 app.get('/:userId/missing', { schema: missingCommentsSchema },async (request, reply) => {
  const { userId } = request.params;

  if (!userId) {
    request.log.warn({ params: request.params }, 'Missing userId');
    return reply.badRequest('userId was not passed');
  }
  const user = request.user._id === userId.toString() ? request.user : null

  if(!user) {
    return reply.badRequest(`Invalid User: ${userId}`);
  }

  const enrollments = await getUserEnrollments(user.ra)
  const comments = await getUserComments(user.ra);
  const enrollmentsFromComments = comments.map(
    (comment) => comment.enrollment.toString(),
  );
  const enrollmentsToComment = [];
  for (const enrollment of enrollments) {
    if (!enrollmentsFromComments.includes(enrollment._id.toString())) {
      enrollmentsToComment.push(enrollment);
    }
  }

  return enrollmentsToComment;
 })

 app.post('/', { schema: createCommentSchema },async (request, reply) => {
  const { enrollment: enrollmentId, comment, type } = request.body;

  if (!comment || !enrollmentId || !type) {
    return reply.badRequest('Body must have all obligatory fields');
  }

  const enrollment = await findById(enrollmentId);

  if (!enrollment) {
    return reply.notFound('Enrollment not found');
  }

  const createdComment = await insert({
    comment,
    type,
    enrollment: enrollment._id,
    subject: enrollment.subject,
    ra: enrollment.ra.toString(),
  })

  return createdComment;
 })

 app.put('/:commentId', { schema: updateCommentSchema }, async (request, reply) => {
  const { commentId } = request.params;

  if (!commentId) {
    request.log.warn({ params: request.params }, 'Missing commentId');
    return reply.badRequest('CommentId was not passed');
  }

  const comment = await findCommentById(commentId);

  if (!comment) {
    request.log.warn(comment, 'Comment missing');
    return reply.notFound('Comment not found');
  }

  comment.comment = request.body.comment;

  await comment.save();

  return comment;
 })

 app.delete('/:commentId', { schema: deleteCommentSchema },async (request, reply) => {
  const { commentId } = request.params;

    if (!commentId) {
      request.log.warn({ params: request.params }, 'Missing commentId');
      return reply.badRequest('CommentId was not passed');
    }

    const comment = await findCommentById(commentId);

    if (!comment) {
      request.log.warn(comment, 'Comment not found');
      return reply.notFound('Comment not found');
    }

    comment.active = false;

    await comment.save();

    return comment;
 })
}



export default plugin;