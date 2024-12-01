import { type Comment, CommentModel } from "@/models/Comment.js";
import { EnrollmentModel } from "@/models/Enrollment.js";

export async function getUserEnrollments(ra: number) {
  const userEnrollments = await EnrollmentModel.find({
    ra,
  }).lean();

  return userEnrollments;
}

export async function getUserComments(ra: number) {
  const userComments = await CommentModel.find({ ra }).lean();
  return userComments;
}

export async function findById(id: string) {
  const enrollment = await EnrollmentModel.findById(id)

  return enrollment  
}

export async function insert(comment: Partial<Comment>) {
  const createdComment = await CommentModel.create(comment);
  return createdComment;
}

export async function findCommentById(commentId: string) {
  const comment = await CommentModel.findOne({
    _id: commentId,
    active: true
  });

  return comment;
}