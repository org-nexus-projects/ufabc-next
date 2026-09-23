import type { FastifyBaseLogger, FastifyRequest } from 'fastify';
import type { AnyObject, QueryFilter as FilterQuery } from 'mongoose';

import { httpErrors } from '@fastify/sensible';
import { Types } from 'mongoose';

import { type Comment, CommentModel } from '@/models/Comment.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import { type Reaction, ReactionModel } from '@/models/Reaction.js';

type RequestUser = FastifyRequest['user'];

type CommentBody = {
  enrollment: string;
  comment: string;
  type: 'teoria' | 'pratica';
};

type CommentParams = {
  commentId: Types.ObjectId;
};

type TeacherCommentsParams = {
  teacherId: Types.ObjectId;
  subjectId?: Types.ObjectId | null;
};

type Pagination = {
  limit: number;
  page: number;
};

export async function getUserEnrollments(ra: number) {
  const userEnrollments = await EnrollmentModel.find({
    ra,
  }).lean();

  return userEnrollments;
}

export async function getUserComments(ra: number) {
  const userComments = await CommentModel.find({ ra: ra.toString() }).lean();
  return userComments;
}

export async function findById(id: string) {
  const enrollment = await EnrollmentModel.findById(id);

  return enrollment;
}

export async function insert(comment: Partial<Comment>) {
  const createdComment = await CommentModel.create(comment);
  return createdComment;
}

export async function findCommentById(commentId: Types.ObjectId | string) {
  const comment = await CommentModel.findOne({
    _id: commentId,
    active: true,
  });

  return comment;
}

type GetReactionQuery = {
  teacherId: Types.ObjectId;
  subjectId?: Types.ObjectId | null;
  userId: Types.ObjectId;
  limit: number;
  page: number;
};

export async function getReactions({
  subjectId,
  teacherId,
  userId,
  page,
  limit,
}: GetReactionQuery) {
  const filter: FilterQuery<AnyObject> = {
    teacher: teacherId,
    active: true,
  };

  if (subjectId) {
    filter.subject = subjectId;
  }

  // @ts-ignore Complex Type Mismatch
  const reactions = await CommentModel.commentsByReaction(
    filter,
    userId,
    [{ path: 'enrollment', select: '-ra' }, 'subject'],
    limit,
    page
  );

  return reactions;
}

export async function createReaction(
  reaction: Omit<Reaction, 'createdAt' | 'updatedAt'>
) {
  const createdReaction = await ReactionModel.create(reaction);
  return createdReaction;
}

export async function findReactionById(filter: FilterQuery<Reaction>) {
  const reaction = await ReactionModel.findOne(filter);
  return reaction;
}

export async function deleteReaction(commentId: Types.ObjectId | string) {
  const deletedReaction = await ReactionModel.deleteOne({ comment: commentId });
  return deletedReaction;
}

export async function listMissingComments(
  user: RequestUser,
  params: { userId: Types.ObjectId },
  log: FastifyBaseLogger
) {
  const { userId } = params;

  if (!userId) {
    log.warn({ params }, 'Missing userId');
    throw httpErrors.badRequest('userId was not passed');
  }
  const owner = user._id === userId.toString() ? user : null;

  if (!owner) {
    throw httpErrors.badRequest(`Invalid User: ${userId}`);
  }

  const enrollments = await getUserEnrollments(owner.ra);
  const comments = await getUserComments(owner.ra);
  const enrollmentsFromComments = comments.map((comment) =>
    comment.enrollment.toString()
  );
  const enrollmentsToComment: typeof enrollments = [];
  for (const enrollment of enrollments) {
    if (!enrollmentsFromComments.includes(enrollment._id.toString())) {
      enrollmentsToComment.push(enrollment);
    }
  }

  return enrollmentsToComment;
}

export async function createComment(
  user: RequestUser,
  body: CommentBody,
  log: FastifyBaseLogger
) {
  const { enrollment: enrollmentId, comment, type } = body;

  if (!comment || !enrollmentId || !type) {
    throw httpErrors.badRequest('Body must have all obligatory fields');
  }

  const enrollment = await findById(enrollmentId);

  if (!enrollment) {
    throw httpErrors.notFound('Enrollment not found');
  }

  if (Number(user.ra) !== Number(enrollment.ra)) {
    log.warn(
      { userRa: user.ra, commentRa: enrollment.ra },
      'Unauthorized comment creation attempt'
    );
    throw httpErrors.forbidden();
  }

  if (!enrollment.subject || !enrollment.ra) {
    log.warn(
      {
        enrollment,
        ra: user.ra,
      },
      'This should not happen'
    );
    throw httpErrors.badRequest('Malformed enrollment, cannot comment');
  }

  const createdComment = await insert({
    comment,
    type,
    enrollment: enrollment._id,
    teacher: enrollment[type] ?? undefined,
    subject: enrollment.subject,
    ra: enrollment.ra.toString(),
  });

  return createdComment;
}

export async function updateComment(
  user: RequestUser,
  params: CommentParams,
  text: string,
  log: FastifyBaseLogger
) {
  const { commentId } = params;

  if (!commentId) {
    log.warn({ params }, 'Missing commentId');
    throw httpErrors.badRequest('CommentId was not passed');
  }

  const comment = await findCommentById(commentId);

  if (!comment) {
    log.warn(comment, 'Comment missing');
    throw httpErrors.notFound('Comment not found');
  }

  if (Number(user.ra) !== Number(comment.ra)) {
    log.warn(
      { userRa: user.ra, commentRa: comment.ra },
      'Unauthorized comment update attempt'
    );
    throw httpErrors.forbidden();
  }

  comment.comment = text;

  await comment.save();

  return comment;
}

export async function deleteComment(
  user: RequestUser,
  params: CommentParams,
  log: FastifyBaseLogger
) {
  const { commentId } = params;

  if (!commentId) {
    log.warn({ params }, 'Missing commentId');
    throw httpErrors.badRequest('CommentId was not passed');
  }

  const comment = await findCommentById(commentId);

  if (!comment) {
    log.warn(comment, 'Comment not found');
    throw httpErrors.notFound('Comment not found');
  }

  if (Number(user.ra) !== Number(comment.ra)) {
    log.warn(
      { userRa: user.ra, commentRa: comment.ra },
      'Unauthorized comment delete attempt'
    );
    throw httpErrors.forbidden();
  }

  comment.active = false;

  await comment.save();

  return comment;
}

export async function listTeacherComments(
  user: RequestUser,
  params: TeacherCommentsParams,
  pagination: Pagination,
  log: FastifyBaseLogger
) {
  const { teacherId, subjectId } = params;
  const { limit, page } = pagination;

  if (!teacherId) {
    log.warn({ params }, 'Missing teacherId');
    throw httpErrors.badRequest('teacherId was not passed');
  }

  const { data, total } = await getReactions({
    teacherId,
    subjectId,
    userId: new Types.ObjectId(user._id),
    limit,
    page,
  });

  return {
    data,
    total,
  };
}

export async function addReaction(
  user: RequestUser,
  commentId: string,
  kind: Reaction['kind']
) {
  if (!user) {
    throw httpErrors.unauthorized('Must be logged');
  }

  if (!commentId) {
    throw httpErrors.badRequest('CommentId was not passed');
  }

  const comment = await findCommentById(commentId);

  if (!comment) {
    throw httpErrors.notFound('Comment not found');
  }

  const reaction = await createReaction({
    kind,
    comment: comment._id,
    user: new Types.ObjectId(user?._id),
    active: true,
  });

  return reaction;
}

export async function removeReaction(
  user: RequestUser,
  commentId: string,
  kind: Reaction['kind']
) {
  if (!commentId && !kind) {
    throw httpErrors.badRequest('CommentId and Kind are necessary');
  }

  const reaction = await findReactionById({
    active: true,
    user: user._id,
    comment: commentId,
    kind,
  });

  if (!reaction) {
    throw httpErrors.notFound(
      `Reação não encontrada no comentário: ${commentId}`
    );
  }

  await deleteReaction(commentId);

  return { status: 'ok' };
}
