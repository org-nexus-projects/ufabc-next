import type {
  Comment,
  CommentDocument,
  CommentModel,
} from '@/models/Comment.js';
import type { Enrollment } from '@/models/Enrollment.js';
import type { FilterQuery, ObjectId, ProjectionType } from 'mongoose';

interface UserCommentRepository {
  insertOne(data: Comment): Promise<Comment>;
  // Perform a soft delete
  findMany(filter: FilterQuery<Comment>): Promise<Comment[]>;
  findOne(
    filter: FilterQuery<Comment>,
  ): Promise<CommentDocument | Comment | null>;
  findEnrollmentById(enrollmentId: ObjectId): Promise<Enrollment | null>;
  findEnrollment(filter: FilterQuery<Enrollment>): Promise<Enrollment[] | null>;
  fetchReactions(
    query: FilterQuery<Comment>,
    userId: string,
    populateFields: ProjectionType<Comment>,
    limit: number,
    page: number,
  ): Promise<{ data: Comment[]; total: number }>;
}

export class CommentRepository implements UserCommentRepository {
  constructor(
    private readonly commentService: typeof CommentModel,
    private readonly enrollmentService: typeof EnrollmentModel,
  ) {}

  async findEnrollmentById(enrollmentId: ObjectId) {
    const enrollment = await this.enrollmentService.findById(enrollmentId);
    return enrollment;
  }

  async findEnrollment(filter: FilterQuery<Enrollment>) {
    const enrollment = await this.enrollmentService.find(filter);
    return enrollment;
  }

  async findOne(filter: FilterQuery<Comment>, pojo?: boolean) {
    if (pojo) {
      const comment = await this.commentService
        .findOne(filter)
        .lean<Comment>(true);
      return comment;
    }
    const comment = await this.commentService.findOne(filter);
    return comment;
  }

  async findMany(filter: FilterQuery<Comment>, pojo?: boolean) {
    if (pojo) {
      const comments = await this.commentService
        .find(filter)
        .lean<Comment[]>(true);
      return comments;
    }
    const comments = await this.commentService.find(filter);
    return comments;
  }

  async insertOne(data: Comment) {
    const createdComment = await this.commentService.create(data);
    return createdComment;
  }

  async fetchReactions(
    query: FilterQuery<Comment>,
    userId: string,
    populateFields: ProjectionType<Comment>,
    limit: number,
    page: number,
  ) {
    const comments = await this.commentService.commentsByReaction(
      query,
      userId,
      populateFields,
      limit,
      page,
    );

    return comments;
  }
}
