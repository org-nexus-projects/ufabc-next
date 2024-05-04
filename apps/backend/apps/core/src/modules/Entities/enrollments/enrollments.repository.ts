import type {
  Comment,
  CommentDocument,
  CommentModel,
} from '@/models/Comment.js';
import type { Enrollment, EnrollmentModel } from '@/models/Enrollment.js';
import type { FilterQuery, ProjectionType } from 'mongoose';

interface EntitiesEnrollmentRepository {
  findOne(
    filter: FilterQuery<Enrollment>,
    populateFields: string[],
    mapping?: ProjectionType<Enrollment>,
  ): Promise<Enrollment | null>;
  findEnrollmentComments(
    filter: FilterQuery<Comment>,
  ): Promise<CommentDocument[] | null>;
}

export class EnrollmentRepository implements EntitiesEnrollmentRepository {
  constructor(
    private readonly enrollmentService: typeof EnrollmentModel,
    private readonly commentService: typeof CommentModel,
  ) {}

  async findOne(
    filter: FilterQuery<Enrollment>,
    mapping: ProjectionType<Enrollment>,
    populateFields: string[],
  ) {
    const enrollment = await this.enrollmentService
      .findOne(filter, mapping)
      .populate(populateFields)
      .lean<Enrollment>(true);
    return enrollment;
  }

  async findEnrollmentComments(filter: FilterQuery<Comment>) {
    const comment = await this.commentService.find(filter);
    return comment;
  }
}
